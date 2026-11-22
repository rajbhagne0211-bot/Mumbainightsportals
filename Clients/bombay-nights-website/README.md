# BOMBAY NIGHTS — New Year's Eve (one-page site)

Plain HTML5 + CSS3 + JavaScript, with Three.js (hero disco ball) and Swiper.js (gallery).
No build step, no npm install. Everything is local, including the libraries in `vendor/`.

## Run
Double-click `index.html`, or serve the folder:

    npx serve .          # or: python3 -m http.server 8080

Google Fonts load online (Bodoni Moda, Bebas Neue, Inter). Offline, the fallback fonts are used.

## Things to confirm / replace (all in `js/config.js`)
1. `eventYear` — set to 2026 (next upcoming New Year's Eve). Confirm with the client.
2. `registrationUrl` — currently `#register`. Every Register / Reserve button follows it.
3. `inclusions` — paste the exact items from the client poster. Nothing was invented;
   until you do, the section shows one clearly marked placeholder card.
4. `instagram` — @rohit0996 and @ayanshk.09 are already linked.

## Music and lighting
- Click "Sound" (desktop nav), the sound button in the mobile bottom bar, or "Play the vibe" to start a
  generated 122 BPM house beat (Web Audio, no audio files). Browsers only allow sound after a click.
- Beams, lasers, the 3D disco ball, glows and the spectrum bars react to the beat.
- Stage lights are canvas effects in `js/lights.js`; the beat engine is `js/music.js`.

## Photos
The images in `assets/images/` are original SVG illustrations (Gateway of India, skyline,
DJ, crowd, banquet, disco ball). To use real photos, add WebP files and change the
`src` of the matching `<img>` tags in `index.html` (hero: `skyline-far.svg`, `skyline-near.svg`, `gateway.svg`).

## Countdown
Target: 31 December, 6:00 PM IST, using a fixed `+05:30` offset, so every visitor
sees the same IST moment. At zero it shows a celebration message instead of negatives.
Test it: open `index.html?countdown=10` (ends 10 seconds after load).

## Structure
    index.html
    css/styles.css
    js/config.js        central settings
    js/countdown.js     live countdown (IST)
    js/three-scene.js   hero disco ball + gold dust (lighter on mobile, CSS fallback)
    js/music.js         generated beat + audio-reactive state
    js/lights.js        beams, lasers, disco glints (canvas)
    js/interactions.js  cursor, sparks, magnetic buttons, tilt, ripple, spectrum, mobile dock
    css/effects.css     hover, lighting and mobile polish
    js/main.js          intro, reveals, nav, drawer, parallax, tilt, Swiper, config rendering
    vendor/             three.min.js (r160), swiper-bundle (v11)
    assets/             SVG illustrations + favicon

Reduced-motion users get no intro, no WebGL and static content.
