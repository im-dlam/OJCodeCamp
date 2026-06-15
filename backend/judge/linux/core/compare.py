def normalize(text: str) -> str:
    if not text: return ""
    return "\n".join(line.rstrip() for line in text.strip().splitlines())