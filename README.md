# SPEAK 'N GL1TCH

> A glitched-out, browser-based Speak 'n Spell synthesizer toy.

Inspired by the classic handheld educational toy from the late 70s — corrupted, overdriven, and drenched in effects. Press letters, mangle words, twist knobs, and let the machine dissolve into noise.

---

## What It Is

**Speak 'n Gl1tch** is an audio toy that lives in your browser. It speaks letters and phrases through a full signal chain of distortion, acid filtering, delay, reverb, and glitch effects — all tunable in real time via a panel of interactive dials.

Built with the Web Audio API and the Web Speech API. No samples, no plugins — everything is synthesized and spoken natively.

---

## Features

### Keyboard
- Full A–Z alphabet — tap any letter to hear it spoken with the current FX applied
- **Spacebar** for inserting spaces between words
- The display screen shows everything you type, CRT scanline and all

### Speak Modes
- **LETTER** — speaks each letter individually as you press it
- **WORD** — speaks the full display text on each keypress

### Action Buttons
| Button | What it does |
|---|---|
| ▶ SPEAK | Speaks the full current display text |
| ⚡ GLITCH | Fires a random 5-letter burst with glitch effects |
| 🎲 RAND WORD | Picks a random word or phrase, loads it, and speaks it |
| 🎰 RAND FX | Scrambles all 7 FX knobs to random values |
| ◎ AMBIENT | Activates ambient mode (see below) |
| CLR | Clears the display |

### FX Control Matrix
Seven dials controlling the live audio signal chain:

| Knob | Effect |
|---|---|
| **DELAY** | Delay time — how far back the echo sits |
| **FEED** | Feedback — how many times the echo repeats |
| **VERB** | Reverb — room size and tail length |
| **DIST** | Distortion — waveshaper saturation amount |
| **ACID** | Filter — bandpass/lowpass resonance sweep (acid character) |
| **PITCH** | Pitch and rate of the speech synthesizer |
| **GLITCH** | Glitch probability and intensity |

**Knob controls:**
- **Click and drag up/down** — the natural dial gesture, value updates live as you move
- **Scroll wheel** — fine-tune while hovering
- The dial needle and numeric value update in real time

### Ambient Mode
Activating **AMBIENT** turns the toy into a self-playing drone machine:

- Loops the current display text every 3–6 seconds
- Uses the full current FX state as the starting point
- Spawns up to 10 detuned oscillators through the distortion → acid filter → reverb → delay chain
- **Drifts upward automatically** — VERB, DELAY, FEEDBACK, DIST, and GLITCH all creep toward maximum with each generation
- The screen shows live drift stats: generation count, current VERB level, current DELAY level
- The FX knobs visually update as the values evolve
- Pairs well with: hit **RAND FX** first to set a starting character, then activate AMBIENT and walk away

### Other Controls
- **PWR** LED — toggles power on/off (stops all audio and ambient mode)

---

## Tech Stack

- **React + Vite** — frontend framework
- **Web Audio API** — all synthesis, distortion, filtering, delay, reverb, and noise generation
- **Web Speech API** — speech synthesis for the voice
- **Tailwind CSS** — styling
- **TypeScript** — throughout

No backend. No external audio libraries. Pure browser APIs.

---

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/speak-n-glitch run dev
```

Then open `http://localhost:<PORT>` in your browser. Check the terminal output for the exact port.

---

## Project Structure

```
artifacts/speak-n-glitch/
├── src/
│   ├── pages/
│   │   └── SpeakNGlitch.tsx   # The entire toy — keyboard, FX chain, ambient loop, knobs
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
└── vite.config.ts
```

The main file `SpeakNGlitch.tsx` contains:
- The `Knob` component (drag + scroll interaction, module-level)
- The full Web Audio signal chain builder
- The ambient loop engine
- All UI

---

## Tips

- Run **RAND FX → AMBIENT** for instant generative ambient drone
- High GLITCH + AMBIENT = the machine falls apart slowly
- High FEED (above 85) with long DELAY creates infinite echoes — be careful with volume
- The speech gets slower and lower as VERB increases in ambient mode (intentional)
- PWR off → on resets ambient mode but keeps your FX settings

---

## License

Do whatever you want with it.
