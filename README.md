# UBLverse

An interactive 3D world for United Breweries Limited, built on a React Three
Fiber + Three.js + GSAP motion engine.

## Run it

```bash
npm install
npm run dev
```

## What's here

- `src/houses/housesConfig.js` — data-driven registry of UBLverse "Houses".
  Add a new House here and the world, camera path and door engine pick it up
  automatically (position on the map is all that's required).
- `src/components/canvas/CameraRig.jsx` — the motion engine. Scroll/touch
  input (via GSAP's `Observer`) drives a single normalized `progress` value
  (0→1); a Catmull-Rom spline built from each House's position turns that
  into a continuous camera path (approach → doorway → interior). Reversible:
  scrolling backward reduces progress and reverses the same path.
- `src/components/canvas/House.jsx` — the reusable House: podium, building,
  roof, pivoting door, hover/selection states, decorative parallax props.
- `src/components/dom/HouseContent.jsx` — the DOM content panel for a House,
  faded in as progress nears 1, reading brand copy from `housesConfig.js`.
- `src/context/PerformanceContext.jsx` — device-tier detection (dpr /
  shadows / antialiasing), same tiering approach as the source engine.

Only **Brewery House** (`detail: 'full'`) has authored content; the other
five Houses reuse the identical engine with placeholder copy, ready to be
filled in.

All fonts (HEINEKEN Curve) and UBL logo assets are bundled locally in
`public/` — no runtime network requests, so the production build (`npm run
build`) is ready for offline/APK packaging.
