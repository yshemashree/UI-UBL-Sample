[UBLversearchitecture.md](https://github.com/user-attachments/files/31263884/UBLversearchitecture.md)
# UBLverse: Architecture & Overview

## Repository

- **Source branch:** `Hemashree-UBL-Basic-Wireframe` (pushed to `StepOne-Automation/UI-Wireframe-Mockup---UBL`)
- **Stack:** React 19 + React Three Fiber + Three.js + GSAP + Vite
- **Offline-ready:** all fonts (HEINEKEN Curve) and UBL logos are bundled locally under `public/` — no CDN or network calls at runtime.

## What it is

UBLverse is an interactive 3D world for United Breweries Limited. Instead of a
conventional scrolling webpage, the user lands directly inside a cinematic 3D
map — a central UB hub connected by roads to six "Houses" (Brewery, Brands,
People, Innovation, Sustainability, Distribution). Scrolling drives a
continuous camera journey through the world; clicking a House triggers a
cinematic approach → door opens → camera crosses the threshold → content
reveals, and a Back button reverses the same path.

---

## Component architecture

```mermaid
graph TD
    main["main.jsx"] --> App["App.jsx"]

    App --> PerfProvider["PerformanceProvider\n(device tier: HIGH/MEDIUM/LOW)"]
    App --> UBLProvider["UBLverseProvider\n(mode, selectedHouseId, shared progress refs)"]

    UBLProvider --> Canvas["react-three-fiber Canvas"]
    UBLProvider --> UI["UBLverseUI\n(logo, wordmark, welcome title, hints)"]
    UBLProvider --> HouseContent["HouseContent\n(DOM content panel, driven by progress ref)"]
    UBLProvider --> Preloader

    Canvas --> Experience["Experience\n(lighting, fog, ContactShadows)"]
    Experience --> CameraRig["CameraRig\n(the motion engine)"]
    Experience --> World["World\n(ground, roads, hub banner)"]

    World --> House["House.jsx (× 6, data-driven)"]
    House --> Door["pivoting Door group"]
    House --> Accessory["per-House signature prop\n(tanks / banner / lamp / ring / solar / crates)"]
    House --> Label["drei &lt;Html&gt; floating label"]

    CameraRig --> Progress["useWorldProgress hook"]
    Progress --> Observer["GSAP Observer\n(wheel / touch / pointer)"]

    housesConfig["housesConfig.js\n(single source of truth: position, theme, content)"] -.data.-> World
    housesConfig -.data.-> House
    housesConfig -.data.-> HouseContent
    housesConfig -.data.-> CameraRig
```

---

## Scroll-driven motion pipeline

This is the core mechanism reused for both the world "tour" (overview) and
each House's entry/exit sequence — one continuous, reversible progress value
drives every visual layer at once, instead of separate competing animations.

```mermaid
flowchart LR
    Input["wheel / touch gesture"] --> Observer["GSAP Observer"]
    Observer --> Delta["native e.deltaY"]
    Delta --> Target["target progress (0 → 1)\nclamped"]
    Target -->|"lerp every frame"| Current["current progress"]
    Current --> Ease["easeInOutCubic(t)"]

    Ease --> Spline["Catmull-Rom camera spline\n(built per-House from its world position)"]
    Spline --> CamPos["camera position / lookAt / fov"]

    Ease --> Door["door rotation\n(smoothstep 0.52 → 0.82)"]
    Ease --> Dim["rest-of-world dim / highlight"]
    Ease --> Content["DOM content panel opacity\n(smoothstep 0.8 → 0.98)"]

    Current -->|"reaches 0 while scrolling back"| Exit["onOverscrollExit\n→ back to World overview"]
```

---

## House interaction state machine

```mermaid
stateDiagram-v2
    [*] --> Overview
    Overview --> Overview: scroll drives world tour spline
    Overview --> House: click / tap a House
    House --> House: scroll scrubs progress 0..1\n(camera approach → door → interior)
    House --> Overview: Back button, or scroll past progress 0
```

---

## Screenshots

See attached image files:

<img width="1400" height="900" alt="v500start" src="https://github.com/user-attachments/assets/8f790eb5-d835-47ed-8ca7-70fc402828d7" />
<img width="1400" height="900" alt="v406tourscroll3" src="https://github.com/user-attachments/assets/7106cc91-1f96-448c-9ed7-1322d4184a02" />
<img width="1400" height="900" alt="v406tourscroll3" src="https://github.com/user-attachments/assets/f29aeac4-d1c0-46de-85cb-3e1bdabb68fb" />


1. **World overview** — the landing world with the "Welcome to The UBLverse" arrival title, six Houses on podiums around the central UB hub.
2. **Scroll-driven world tour** — mid-scroll, camera flying past Brewery/Brands Houses with real parallax (trees, lamp posts, other Houses passing through frame).
3. **Camera approaching a House** — real 3D travel toward the selected House, not a cut or fade.
4. **Inside Brewery House** — authored content panel (heading, stats, back button) in the HEINEKEN Curve font over the interior.
5. **Returning to the overview** — camera settled back after the exit animation.
