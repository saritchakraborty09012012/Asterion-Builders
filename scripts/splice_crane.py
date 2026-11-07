from pathlib import Path

p = Path('src/three/World.tsx')
s = p.read_text(encoding='utf-8')
start = s.index('function Crane({')
end = s.index('function WorkerCrew(', start)
new = Path('scripts/crane_new.txt').read_text(encoding='utf-8')
s = s[:start] + new + '\n' + s[end:]
p.write_text(s, encoding='utf-8')
print('spliced crane', start, end, len(s))
