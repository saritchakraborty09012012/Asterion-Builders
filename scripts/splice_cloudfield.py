from pathlib import Path

p = Path('src/three/World.tsx')
s = p.read_text(encoding='utf-8')
start = s.index('export function CloudField(')
end = s.index('/* ------------------------------------------------------------------ */\n/*  the circular neighbourhood', start)
new = Path('scripts/cloudfield_new.txt').read_text(encoding='utf-8')
s = s[:start] + new + '\n' + s[end:]
p.write_text(s, encoding='utf-8')
print('spliced cloudfield', start, end, len(s))
