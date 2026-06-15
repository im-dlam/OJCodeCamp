def normalize(text: str) -> str:
    return "\n".join(
        line.rstrip()
        for line in text.strip().splitlines()
    )