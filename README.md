# Dice Roller 🎲

A free online dice roller for tabletop games. Roll 1–6 dice in d4, d6, d8,
d10, d12 or d20, with a tumbling roll animation, a total, and a full roll
history saved in your browser.

## Features

- **Full die set** — d4, d6, d8, d10, d12, d20
- **1–6 dice** — slider for how many dice to roll at once
- **Roll animation** — dice tumble through random faces, then land on the result
- **Total** — sum of all dice, shown big and clear
- **Critical calls** — natural 20 and natural 1 on a d20 get a special callout
- **Roll history** — every roll saved (newest first), with time stamps; clearable
- **Space to roll** — press Space anywhere on the page to roll again
- Responsive, keyboard-friendly, `aria-live` results, `prefers-reduced-motion` respected

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no dependencies — just open `index.html` (or serve it).

## Deploy

Static site — drop the folder on any static host (GitHub Pages, Netlify,
Vercel, or any web server). The only external dependency is Google Fonts.
