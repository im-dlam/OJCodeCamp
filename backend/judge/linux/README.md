# Cài đặt & Setup Môi trường (Linux/Ubuntu)

Để hệ thống chạy mượt và an toàn,  cần cấu hình Server (VPS). Hãy chạy các lệnh này trên terminal của server.

---

## 1. Tạo thư mục RAM Disk cho Worker

```bash
# Tạo thư mục gốc trên RAM
sudo mkdir -p /dev/shm/submissions

# Cấp quyền đọc/ghi/thực thi cho tất cả mọi người
sudo chmod 777 /dev/shm/submissions
```

---

## 2. Cấu hình Sudoers (Cực kỳ quan trọng)

Worker của bạn chạy bằng user mặc định (ví dụ: `ubuntu`), nhưng nó cần dùng lệnh `sudo unshare` và `sudo prlimit` mà không bị hệ thống hỏi mật khẩu.

Mở file cấu hình sudoers:

```bash
sudo visudo
```

Thêm dòng sau vào cuối file (thay `ubuntu` bằng tên user hiện tại của server bạn):

```plaintext
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/unshare, /usr/bin/prlimit, /usr/bin/sudo
```

Lưu lại và thoát:

- `Ctrl + X`
- `Y`
- `Enter`

---

## 3. Cài đặt các thư viện cần thiết

```bash
sudo apt update

sudo apt install -y \
    g++ \
    python3 \
    pm2 \
    redis-server

pip install redis sqlalchemy psycopg2-binary
```

---

## Kiểm tra cài đặt

### Kiểm tra Redis

```bash
redis-cli ping
```

Kết quả mong muốn:

```text
PONG
```

### Kiểm tra g++

```bash
g++ --version
```

### Kiểm tra Python

```bash
python3 --version
```

### Kiểm tra PM2

```bash
pm2 -v
```

---

## Ghi chú bảo mật

- Chỉ cấp quyền `NOPASSWD` cho các lệnh thực sự cần thiết.
- Không chạy Worker bằng tài khoản `root`.
- Nên tạo user riêng cho hệ thống Judge nếu triển khai môi trường production.
- Thư mục `/dev/shm/submissions` nằm trên RAM nên dữ liệu sẽ bị xóa khi server khởi động lại.
- Redis nên được cấu hình chỉ cho phép truy cập nội bộ (`127.0.0.1`) nếu không cần truy cập từ bên ngoài.

---


# Chạy 4 worker gunicorn để hứng API
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# truy cập vào postgres
sudo -u postgres psql

# Khởi chạy Native Judge Workers:
# Di chuyển vào thư mục worker và chạy lệnh này để mở 8 luồng (thay số 8 bằng số Core CPU VPS của bạn)
<!-- pm2 start main_worker.py --name "judge-worker" -i 8 -->
pm2 start ./judge/linux/main_worker.py --name "judge-worker" -i 2
# run 
pm2 restart native-judge