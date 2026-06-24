def normalize(text: str) -> str:
    if not text:
        return ""
        
    lines = [line.rstrip() for line in text.splitlines()]
    
    while lines and not lines[-1]:
        lines.pop()
        
    return "\n".join(lines)