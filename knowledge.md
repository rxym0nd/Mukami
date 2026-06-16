# Mukami Ohana – Interactive Love Letter PWA

## Overview
**Mukami Ohana** is a Progressive Web App (PWA) designed as a personalized, interactive love letter for Mukami. It combines storytelling, a marriage proposal, a voice note, ambient audio, and whimsical animations (stars, floating hearts, shooting stars, confetti, etc.) to create a magical, engaging experience.

- **Purpose**: To express love, propose, and celebrate the relationship with Mukami through an immersive web app that works offline and feels like a native app.
- **Status**: Complete, with all interactive features functional.
- **Technology Stack**: HTML5, CSS3 (with CSS variables, animations, flexbox/grid), JavaScript (ES6+), Service Workers for PWA capabilities, Web Audio API for ambient music and sound effects, localStorage for state persistence.

## Features

| Feature | Description |
|---------|-------------|
| **Unlock Screen** | Requires the secret word "ohana" (Stitch’s favorite) to begin. |
| **Ambient Soundscape** | Procedurally generated ocean‑wave noise plus a melodic plucked synth chord progression, toggleable via a music button. |
| **Starry Sky & Floating Hearts** | CSS‑animated background layers that add depth and whimsy. |
| **Shooting Stars** | Randomly spawning animated meteors across the top of the viewport. |
| **Cursor Effects** | Heart trail on mousemove and sparkle bursts on clicks. |
| **Interactive Envelope** | Click to open the envelope, triggering the story and initializing audio if not already playing. |
| **Love Story Timeline** | A scrollable sequence of love‑card sections (Why You…, Every Day With You…, You’re My Lobster…) revealed via IntersectionObserver as the user scrolls. |
| **Reasons Ticker** | An infinite, horizontally scrolling list of reasons the creator loves Mukami (duplicated for seamless looping). |
| **Proposal Section** | Features a custom SVG Stitch illustration, a typewriter‑animated proposal title, a “Yes!” button that grows as the “No!” button tries to escape, and a Stitch thief that steals the No button after three attempts. |
| **Victory Audio & Confetti** | Upon accepting the proposal, a victory song plays, confetti showers, and the app transitions to the success screen. |
| **Success Screen** | Displays a happy dancing Stitch, a typewriter‑animated love letter, a live “Together Since” counter (days, hours, minutes, seconds), anniversary countdown milestones (1 week, 1 month, 3 months, 6 months, 1 year, 2 years, 3 years), a voice note player, and a pulsing heart. |
| **Voice Note** | Pre‑recorded audio (`voice-note.wav`) with play/pause, progress bar, and time display; ambient volume ducts when voice note plays. |
| **Replay Journey** | Button to reset the app to the initial envelope state, clearing localStorage and restarting animations. |
| **Installability** | PWA manifest with icons; a service worker caches assets for offline use; an install button appears when the browser supports `beforeinstallprompt`. |
| **Accessibility** | Skip‑link, ARIA labels, prefers‑reduced‑motion media query to disable animations, semantic HTML, focus‑visible styles. |
| **Responsive Design** | Layout adapts to mobile (breakpoints at 480px and 320px) while preserving visual integrity. |

## File Structure

```
Mukami/
├─ index.html          # Main HTML structure and content
├─ style.css           # All styling, CSS variables, animations, layout
├─ script.js           # Application logic: audio, animations, state, transitions, effects
├─ manifest.json       # PWA metadata (name, icons, display, theme colors)
├─ sw.js               # Service worker for caching and offline support
├─ voice-note.wav      # Pre‑recorded voice note (played in success section)
├─ icon-192.png        # 192×192 PNG icon
├─ icon-512.png        # 512×512 PNG icon
├─ icon-192.svg        # 192×192 SVG icon (fallback)
├─ icon-512.svg        # 512×512 SVG icon (fallback)
└─ knowledge.md        # This file – project documentation
```

## Key Implementation Details

### Audio Engine (script.js)
- Uses the **Web Audio API** to generate:
  - **Ocean wave ambience**: low‑pass filtered white noise with an LFO modulating cutoff frequency.
  - **Plucked synth melody**: triangle‑wave oscillators with envelope gains and low‑pass filter sweeps.
  - **Victory song**: a short, uplifting plucked sequence.
  - **Happy beat** (loops after victory): chords with staggered plucks.
- Audio context is created/resumed on user interaction (unlock or envelope open) to comply with autoplay policies.
- Audio nodes are stored in `ambientNodes` for easy start/stop and gain manipulation (e.g., lowering volume when voice note plays).

### Animations & Effects
- **Stars**: `twinkle` keyframes varying opacity and scale.
- **Floating Hearts**: `floatUp` keyframes moving hearts upward with fade.
- **Cursor Hearts & Sparkles**: DOM elements created on mousemove/click, removed after timeout via CSS `animation`.
- **Shooting Stars**: Random length, angle, duration; animated with `shootAcross` using CSS custom properties (`--travel-x`, `--travel-y`).
- **Confetti**: Simple falling elements with random symbols and durations.
- **Typewriter Effect**: Implemented via `typeText` function that increments text content over time, respecting `prefers-reduced-motion`.
- **Stitch Thief & Runaway No Button**: The “No” button moves on hover/tap; after three escapes, Stitch SVG animates in and removes the button.

### State Persistence
- Uses `localStorage` under key `mukami-ohana-state` to store the currently active section and whether the envelope is opened.
- On load, `restoreState()` re‑activates the appropriate section and reapplies the envelope open state.
- A separate flag `mukami-ohana-unlocked` tracks whether the secret word has been entered, skipping the unlock screen on subsequent visits.

### Service Worker (sw.js)
- **Cache‑First** strategy for GET requests to core assets (`./`, `index.html`, `style.css`, `script.js`, `manifest.json`, icons, voice note).
- On install, caches `APP_ASSETS`; on activate, clears old caches.
- Fetch handler returns cached response if available; otherwise fetches, caches the response (if basic/cors and OK), and navigates to `index.html` on navigation‑type failures.

### Manifest (manifest.json)
- Defines the PWA name (`Mukami Ohana`), short name, start URL, display mode (`standalone`), background and theme colors, description, and multiple icon formats (PNG and SVG) for wide compatibility.

### Responsiveness
- CSS media queries adjust sizes, padding, and layout for screens ≤480px and ≤320px.
- Font‑size scaling, container widths, and envelope dimensions adapt to smaller viewports.
- Animations are disabled when `prefers-reduced-motion: reduce` is set.

## How to Run / Develop
1. Clone or copy the repository to a local web server (e.g., using `python -m http.server`, `serve`, or any static‑file host).
2. Ensure the site is served over **HTTPS** (or localhost) for service worker registration and autoplay audio.
3. Open `index.html` in a modern browser (Chrome, Edge, Safari, Firefox).
4. To test the install flow, open DevTools → Application → Manifest, or use the “Install App” button that appears after meeting the PWA criteria.
5. For offline testing, enable the “Offline” checkbox in the Service Workers pane of DevTools after the first load.

## Future Enhancements (Ideas)
- Allow customization of the secret word, milestone dates, and voice note via a simple admin panel.
- Add multilingual support (i18n) for the story and UI.
- Enable user‑generated drawings or stickers that float across the screen.
- Integrate a backend to save and share the completed letter as a shareable URL or image.
- Provide a dark‑mode toggle (already uses dark theme) with optional light variant.

## Recent Fixes and Tuning
- Fixed missing `envelopeOpen` global variable declaration.
- Fixed `restoreState()` to correctly retrieve the envelope element.
- Updated `showSection()` to persist `envelopeOpen` state across section transitions, ensuring the envelope remains open when navigating through the story.
- Removed proposal section since she said yes - story now transitions directly to success screen.
- Updated button references and section IDs to reflect new flow: unlock → envelope → story → success.
- Removed proposal-specific UI elements (runaway "No" button, Stitch thief, Yes/No buttons).
- Minor code clean‑up and comment updates for clarity.

## Credits
- Created by Raymond for Mukami, inspired by personal affection and the desire to build a memorable, interactive experience.
- Visual motifs (Stitch, Ohana, floral accents) are inspired by Disney’s *Lilo & Stitch* and personal meaning.
- Audio synthesis implemented entirely in‑browser using the Web Audio API — no external samples.

--- 

*This document is intended to be kept up‑to‑date as the project evolves.*