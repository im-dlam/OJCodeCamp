import json
import time
import os
import zlib
import struct
import hmac
import hashlib, base64
from typing import Any, Dict, Optional, Literal
from dataclasses import dataclass
from collections import OrderedDict
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
from datetime import datetime

class ExpiredSignatureError(Exception):
    pass

# ============================================================
# CONFIG
# ============================================================

@dataclass
class TokenConfig:
    prefix: str = "L"
    suffix: str = "LDL"
    version: int = 1
    default_ttl: int = 3600
    algorithm: Literal["chacha20", "aes-gcm"] = "chacha20"
    hash_algorithm: Literal["fnv1a", "hmac-sha256", "siphash"] = "fnv1a"
    compression: bool = True
    compression_level: int = 1
    cache_enabled: bool = False
    cache_ttl: int = 300
    cache_max_size: int = 100_000

    def __str__(self) -> str:
        return (
            f"TokenConfig(prefix={self.prefix!r}, suffix={self.suffix!r}, "
            f"version={self.version}, default_ttl={self.default_ttl}, "
            f"algorithm={self.algorithm!r}, hash_algorithm={self.hash_algorithm!r}, "
            f"compression={self.compression}, compression_level={self.compression_level}, "
            f"cache_enabled={self.cache_enabled}, cache_ttl={self.cache_ttl}, "
            f"cache_max_size={self.cache_max_size})"
        )

# ============================================================
# LRU CACHE
# ============================================================

class LRUCache:
    __slots__ = ('_max_size', '_ttl', '_cache')

    def __init__(self, max_size: int = 100_000, ttl: int = 300):
        self._max_size = max_size
        self._ttl = ttl
        self._cache: OrderedDict = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        value, ts = entry
        if time.time() - ts > self._ttl:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return value

    def put(self, key: str, value: Any):
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = (value, time.time())
        else:
            if len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)
            self._cache[key] = (value, time.time())

    def delete(self, key: str):
        self._cache.pop(key, None)

    def clear(self):
        self._cache.clear()

    def __len__(self) -> int:
        return len(self._cache)


# ============================================================
# BASE62 ENCODER
# ============================================================

class Base62:
    __slots__ = ('_alphabet', '_decode_table')

    ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    def __init__(self):
        self._alphabet = self.ALPHABET
        self._decode_table = {c: i for i, c in enumerate(self.ALPHABET)}

    def encode(self, data: bytes) -> str:
        if not data:
            return "A"

        leading_zeros = 0
        for b in data:
            if b == 0:
                leading_zeros += 1
            else:
                break

        num = int.from_bytes(data, 'big')
        if num == 0:
            return self._alphabet[0] * max(leading_zeros, 1)

        chars = []
        alphabet = self._alphabet
        while num > 0:
            num, rem = divmod(num, 62)
            chars.append(alphabet[rem])
        chars.reverse()

        data_len = len(data)
        len_hi, len_lo = divmod(data_len, 62)
        length_prefix = alphabet[len_hi] + alphabet[len_lo]

        return length_prefix + (self._alphabet[0] * leading_zeros) + ''.join(chars)

    def decode(self, encoded: str) -> bytes:
        if not encoded or len(encoded) < 3:
            return b''

        table = self._decode_table
        data_len = table[encoded[0]] * 62 + table[encoded[1]]
        body = encoded[2:]

        if not body:
            return b'\x00' * data_len

        num = 0
        for char in body:
            num = num * 62 + table[char]

        if num == 0:
            return b'\x00' * data_len

        byte_length = (num.bit_length() + 7) // 8
        result = num.to_bytes(byte_length, 'big')

        if len(result) < data_len:
            result = b'\x00' * (data_len - len(result)) + result

        return result[:data_len]

    def encode_int(self, num: int, pad: int = 0) -> str:
        """Encode số nguyên nhỏ → base62 string (chỉ chữ cái/số)"""
        if num == 0:
            s = self._alphabet[0]
        else:
            chars = []
            while num > 0:
                num, rem = divmod(num, 62)
                chars.append(self._alphabet[rem])
            chars.reverse()
            s = ''.join(chars)
        return s.rjust(pad, self._alphabet[0])

    def decode_int(self, encoded: str) -> int:
        """Decode base62 string → số nguyên"""
        num = 0
        for char in encoded:
            num = num * 62 + self._decode_table[char]
        return num


# ============================================================
# ENCRYPTION BACKENDS
# ============================================================

class ChaCha20Backend:
    __slots__ = ('_key', '_backend')
    NONCE_SIZE = 16

    def __init__(self, key: bytes):
        self._key = key[:32]
        self._backend = default_backend()

    def encrypt(self, plaintext: bytes) -> bytes:
        nonce = os.urandom(self.NONCE_SIZE)
        cipher = Cipher(
            algorithms.ChaCha20(self._key, nonce),
            mode=None, backend=self._backend
        )
        return nonce + cipher.encryptor().update(plaintext)

    def decrypt(self, data: bytes) -> bytes:
        cipher = Cipher(
            algorithms.ChaCha20(self._key, data[:self.NONCE_SIZE]),
            mode=None, backend=self._backend
        )
        return cipher.decryptor().update(data[self.NONCE_SIZE:])


class AESGCMBackend:
    __slots__ = ('_aead',)
    NONCE_SIZE = 12

    def __init__(self, key: bytes):
        self._aead = AESGCM(key[:32])

    def encrypt(self, plaintext: bytes) -> bytes:
        nonce = os.urandom(self.NONCE_SIZE)
        return nonce + self._aead.encrypt(nonce, plaintext, None)

    def decrypt(self, data: bytes) -> bytes:
        return self._aead.decrypt(data[:self.NONCE_SIZE], data[self.NONCE_SIZE:], None)


# ============================================================
# HASH BACKENDS
# ============================================================

class FNV1aHash:
    __slots__ = ()

    @staticmethod
    def sign(key: bytes, data: bytes) -> bytes:
        h = 0xcbf29ce484222325
        for b in key + data:
            h = ((h ^ b) * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
        return struct.pack('>Q', h)


class HMACSha256Hash:
    __slots__ = ()

    @staticmethod
    def sign(key: bytes, data: bytes) -> bytes:
        return hmac.new(key, data, hashlib.sha256).digest()[:16]


class SipHash:
    __slots__ = ()

    @staticmethod
    def sign(key: bytes, data: bytes) -> bytes:
        return hmac.new(key[:16], data, hashlib.md5).digest()[:8]


# ============================================================
# TOKEN ENGINE
# ============================================================

class TokenL:
    """
    Token liền mạch: {prefix}{body}{suffix}

    Body structure (all base62, no digits-only headers):
      [version: 1 char base62]
      [ts_len: 2 chars base62]
      [timestamp: ts_len chars]
      [payload_len: 3 chars base62]
      [payload: payload_len chars]
      [signature: còn lại]
    """

    __slots__ = ('_key', '_config', '_b62', '_cipher', '_hasher', '_cache')

    def __init__(self, secret_key: bytes, config: TokenConfig = None):
        if len(secret_key) < 32:
            raise ValueError("Secret key phải >= 32 bytes")
        self._key = secret_key[:32]
        self._config = config or TokenConfig()
        self._b62 = Base62()

        if self._config.algorithm == "chacha20":
            self._cipher = ChaCha20Backend(self._key)
        elif self._config.algorithm == "aes-gcm":
            self._cipher = AESGCMBackend(self._key)
        else:
            raise ValueError(f"Unknown algorithm: {self._config.algorithm}")

        if self._config.hash_algorithm == "fnv1a":
            self._hasher = FNV1aHash()
        elif self._config.hash_algorithm == "hmac-sha256":
            self._hasher = HMACSha256Hash()
        elif self._config.hash_algorithm == "siphash":
            self._hasher = SipHash()
        else:
            raise ValueError(f"Unknown hash: {self._config.hash_algorithm}")

        if self._config.cache_enabled:
            self._cache = LRUCache(self._config.cache_max_size, self._config.cache_ttl)
        else:
            self._cache = None

    def compute_expires(self, ttl) -> int:
        """
        Compute expiry timestamp (epoch seconds).
        Accepts:
        - ttl as a duration in seconds (int/float), OR
        - ttl as an absolute expiry epoch (seconds or milliseconds).
        Heuristic:
        - If ttl looks like an epoch (greater than current time/1000), treat it as epoch.
        - If ttl is very large (milliseconds), convert to seconds.
        """
        now = time.time()

        # normalize numeric types
        try:
            ttl_val = float(ttl)
        except (TypeError, ValueError):
            raise ValueError("ttl must be numeric or parseable as float")

        # if looks like milliseconds epoch (e.g. ~1.7e12), convert to seconds
        if ttl_val > 1e11:  # > ~100 billion -> very likely milliseconds epoch
            ttl_val = ttl_val / 1000.0

        # if ttl is greater than now, treat it as an absolute expiry timestamp
        if ttl_val > now:
            expires = ttl_val
        else:
            # ttl_val is a duration in seconds
            expires = now + ttl_val

        return int(expires)


    def create_token_micro(self, data: Any, prefix: str = "bit_") -> str:
            js_b = json.dumps(data, separators=(',', ':')).encode()
            payload = b'\x01' + zlib.compress(js_b, 9) # Nén level 9 cao nhất
            
            # Chỉ mã hóa, không cần tự ký (AES-GCM đã tự động xác thực toàn vẹn dữ liệu)
            enc = self._cipher.encrypt(payload)
            
            b64_str = base64.urlsafe_b64encode(enc).decode().rstrip('=')
            
            token_micro = f"{prefix}{b64_str}"
            if self._cache: self._cache.put(token_micro, data)
            return token_micro

    def decode_token_micro(self, token: str, prefix: str = "bit_") -> Optional[Any]:
        if self._cache and (cached := self._cache.get(token)): return cached
        if not token.startswith(prefix): return None
        
        b64_str = token[len(prefix):]
        # Thêm lại padding '=' bị thiếu để Base64 decode không báo lỗi
        b64_str += "=" * ((4 - len(b64_str) % 4) % 4)
        
        try:
            enc = base64.urlsafe_b64decode(b64_str)
            dec = self._cipher.decrypt(enc) # Lỗi sai key hoặc bị sửa đổi sẽ bị văng Exception ở đây
            
            data = json.loads((zlib.decompress(dec[1:]) if dec[0] == 1 else dec[1:]).decode())
            if self._cache: self._cache.put(token, data)
            return data
        except Exception as e:
            raise ValueError(e)

    def create(self, data: Dict[str, Any], ttl: int = None) -> str:
        cfg = self._config
        b62 = self._b62
        now = int(time.time())
        if ttl is None:
            ttl = cfg.default_ttl
        expires = self.compute_expires(ttl)
        # Encode parts
        payload_bytes = self._encode_payload(data, now, expires)
        encrypted = self._cipher.encrypt(payload_bytes)
        encoded_payload = b62.encode(encrypted)
        encoded_ts = b62.encode(struct.pack('>I', now))

        # Signature
        sig_input = f"{cfg.version}{encoded_ts}{encoded_payload}".encode()
        signature = self._hasher.sign(self._key, sig_input)
        encoded_sig = b62.encode(signature)

        # Length headers encoded as base62 (letters, not digits)
        # version: 1 char, ts_len: 2 chars, payload_len: 3 chars
        ver_char = b62.encode_int(cfg.version, pad=1)
        ts_len_chars = b62.encode_int(len(encoded_ts), pad=2)
        payload_len_chars = b62.encode_int(len(encoded_payload), pad=3)

        # Assemble seamlessly
        body = (
            f"{ver_char}"
            f"{ts_len_chars}{encoded_ts}"
            f"{payload_len_chars}{encoded_payload}"
            f"{encoded_sig}"
        )

        token = f"{cfg.prefix}{body}{cfg.suffix}"

        if self._cache is not None:
            self._cache.put(token, data)
        return token

    def verify(self, token: str) -> Optional[Dict[str, Any]]:
        if self._cache is not None:
            cached = self._cache.get(token)
            if cached is not None:
                raise ValueError("Token Error")

        try:
            cfg = self._config
            b62 = self._b62

            if not token.startswith(cfg.prefix) or not token.endswith(cfg.suffix):
                raise ValueError("Token Error::346")


            # Strip prefix/suffix
            if cfg.suffix:
                body = token[len(cfg.prefix):-len(cfg.suffix)]
            else:
                body = token[len(cfg.prefix):]

            pos = 0

            # Version (1 char base62)
            version = b62.decode_int(body[pos:pos + 1]); pos += 1
            if version != cfg.version:
                return None

            # Timestamp length (2 chars base62)
            ts_len = b62.decode_int(body[pos:pos + 2]); pos += 2
            encoded_ts = body[pos:pos + ts_len]; pos += ts_len

            # Payload length (3 chars base62)
            payload_len = b62.decode_int(body[pos:pos + 3]); pos += 3
            encoded_payload = body[pos:pos + payload_len]; pos += payload_len

            # Signature = remaining
            encoded_sig = body[pos:]

            # Verify signature
            sig_input = f"{version}{encoded_ts}{encoded_payload}".encode()
            expected_sig = self._hasher.sign(self._key, sig_input)
            actual_sig = b62.decode(encoded_sig)

            if not hmac.compare_digest(expected_sig[:len(actual_sig)], actual_sig):
                raise ValueError("Token Error::379")

            # Decrypt
            encrypted = b62.decode(encoded_payload)
            payload_bytes = self._cipher.decrypt(encrypted)
            data, exp = self._decode_payload(payload_bytes)
            if exp < time.time():
                raise ValueError("Token Expired")

            if self._cache is not None:
                self._cache.put(token, data)
            return data

        except Exception as e:
            raise ValueError(e)

    def inspect(self, token: str) -> Dict[str, Any]:
        try:
            cfg = self._config
            b62 = self._b62
            if not token.startswith(cfg.prefix) or not token.endswith(cfg.suffix):
                return {"valid_format": False}

            if cfg.suffix:
                body = token[len(cfg.prefix):-len(cfg.suffix)]
            else:
                body = token[len(cfg.prefix):]

            version = b62.decode_int(body[0:1])
            ts_len = b62.decode_int(body[1:3])
            encoded_ts = body[3:3 + ts_len]
            ts_bytes = b62.decode(encoded_ts)
            timestamp = struct.unpack('>I', ts_bytes[:4])[0]

            return {
                "valid_format": True,
                "prefix": cfg.prefix,
                "suffix": cfg.suffix,
                "version": version,
                "created_at": datetime.fromtimestamp(timestamp).isoformat(),
                "created_ts": timestamp,
                "token_length": len(token),
            }
        except Exception:
            return {"valid_format": False}

    def revoke(self, token: str):
        if self._cache is not None:
            self._cache.delete(token)

    def refresh(self, old_token: str, new_ttl: int = None) -> Optional[str]:
        data = self.verify(old_token)
        if data is None:
            return None
        self.revoke(old_token)
        return self.create(data, ttl=new_ttl)

    def _encode_payload(self, data: Dict, iat: int, exp: int) -> bytes:
        header = struct.pack('>II', exp, iat) + os.urandom(4)
        json_bytes = json.dumps(data, separators=(',', ':')).encode('utf-8')
        if self._config.compression:
            body = zlib.compress(json_bytes, self._config.compression_level)
            return b'\x01' + header + body
        else:
            return b'\x00' + header + json_bytes

    def _decode_payload(self, payload_bytes: bytes) -> tuple:
        flag = payload_bytes[0]
        header = payload_bytes[1:13]
        body = payload_bytes[13:]
        exp, iat = struct.unpack('>II', header[:8])
        json_bytes = zlib.decompress(body) if flag == 0x01 else body
        data = json.loads(json_bytes.decode('utf-8'))
        return data, exp

    @property
    def config(self) -> TokenConfig:
        return self._config

    @property
    def cache_size(self) -> int:
        return len(self._cache) if self._cache else 0


# ============================================================
# TOKEN MANAGER
# ============================================================

class TokenManager:
    def __init__(self, secret_key: bytes, config: TokenConfig = None):
        self.engine = TokenL(secret_key, config)
        self._blacklist: set = set()

    def encode(self, data: Dict[str, Any], ttl: int = None) -> str:
        return self.engine.create(data, ttl=ttl)

    def decode(self, token: str) -> Optional[Dict[str, Any]]:
        if token in self._blacklist:
            return None
        return self.engine.verify(token)

    def verify(self, token: str, required_fields: Dict = None) -> bool:
        data = self.decode(token)
        if data is None:
            return False
        if required_fields:
            for k, v in required_fields.items():
                if data.get(k) != v:
                    return False
        return True

    def revoke(self, token: str):
        self._blacklist.add(token)
        self.engine.revoke(token)

    def refresh(self, old_token: str, new_ttl: int = None) -> Optional[str]:
        if old_token in self._blacklist:
            return None
        data = self.decode(old_token)
        if data is None:
            return None
        self.revoke(old_token)
        return self.encode(data, ttl=new_ttl)
