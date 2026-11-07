from pathlib import Path

p = Path('src/three/World.tsx')
s = p.read_text(encoding='utf-8')
start = s.index('export function Community({')
end = s.index('/* ------------------------------------------------------------------ */\n/*  completed tower', start)
new = Path('scripts/community_new.txt').read_text(encoding='utf-8')
s = s[:start] + new + '\n' + s[end:]
p.write_text(s, encoding='utf-8')
print('spliced', start, end, len(s))
