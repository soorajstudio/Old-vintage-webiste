# 🛡️ The Chronicles of Eldoria — Vintage 3D Reliquary & Curio Cabinet

An immersive, museum-grade vintage 3D web experience showcasing **26 authentic 3D models** (weapons, potions, architectural wonders, and ancient curiosities) recovered from the realm. Built with modern WebGL, Three.js, and procedural Web Audio ambience.

---

## ✨ Features

- **🏛️ The Grand 3D Reliquary Chamber (Hero Stage)**
  - Real-time interactive 3D inspection powered by Three.js `GLTFLoader` and `OrbitControls`.
  - **Dynamic Auto-Centering & Framing**: Calculates true 3D bounding boxes to scale and frame any model (from tiny potion vials to massive fortress watchtowers) with optimal camera angles and zoom limits.
  - **Atmospheric Pedestal & Embers**: Relics rest on a runic stone and burnished brass dias surrounded by floating embers and candlelit dust motes.
  - **4 Cinematic Lighting Atmospheres**:
    - 🔥 **Hearthfire & Torchlight** (Warm flickering candlelight and deep shadows)
    - 🌙 **Moonlit Crypt** (Cool midnight silver highlights)
    - 🔮 **Arcane Resonator** (Pulsing violet and turquoise sorcery glow)
    - ☀️ **Sunlit Antiquarium** (Neutral high-CRI daylight)
  - **Daguerreotype Camera**: Capture high-resolution framed snapshots of any 3D relic with an antique museum border.
  - **Runic Wireframe Blueprint Mode**: Toggle holographic mesh topology.

- **📜 Curator's Codex & Ledger**
  - Rich historical lore, provenance, chronicle era, material composition, and physical weight for each artifact.
  - RPG-style stat meters: *Durability*, *Arcane Potency*, *Lethality*, and *Masterwork Craftsmanship*.

- **🏺 The Curio Cabinet (All 26 Relics)**
  - Filterable by Category:
    - ⚔️ **Weapons & Armory** (Warhammer, Battle Axe, Viking Shield, Bone Spear, Greatsword, Hand Axe, Mining Mattock, etc.)
    - 🧪 **Alchemy & Arcana** (Celestial Elixir, Apothecary Flask, Skull Potion, Resonator Crystal, Covenant Scroll)
    - 🏰 **Architecture & Wonders** (Watchtower, Enchanted Cottage, Medieval Tavern, Timber Workshop, Stone Shrine, Crossroads Signpost)
    - 🗝️ **Relics & Curios** (Gilded Corsair Chest, Wall Lantern, Urn of the High Kings, Astrolabe Sphere, Chrono-Data Matrix)
  - Instant live search by name, origin, or material.
  - In-memory caching: previously loaded 3D models switch instantaneously.

- **⚒️ The Alchemist & Armorer's Forge**
  - Live interactive material tuning:
    - **Surface Patina Slider**: Tweak metal roughness from high-gloss polish to centuries of oxidation.
    - **Arcane Infusion Palette**: Imbue the 3D model with elemental tints (*Raw Metal*, *Dragon Gold*, *Blood Ruby*, *Emerald Poison*, *Astral Sapphire*, *Void Netherglow*).
    - **Turntable Velocity Control**: Customize rotation speed or pause rotation.

- **🎧 Procedural Soundscape Engine**
  - Zero-download, authentic procedural audio synthesized via the Web Audio API:
    - Crackling fireplace hearth embers & wood snaps.
    - Ethereal harmonic fifth drone (arcane resonance).
    - Tactile brass clicks and parchment page turns on interaction.

- **🔏 The Adventurer's Ledger (Guestbook)**
  - Sign your name, guild allegiance, and inscription into the persistent ledger (`localStorage`).

---

## 🚀 Quick Start

### Option 1: Double-Click (Windows)
Double-click `start-website.bat` in this folder. It will launch the local development server and open your browser automatically.

### Option 2: Command Line
```bash
# Start the local development server
npm run dev
```
Then visit:
```
http://localhost:5174/
```

### Production Build
```bash
npm run build
```
Build output is saved to the `dist/` directory.

---

## 📁 Repository Structure

```text
├── index.html                   # Master HTML with vintage layout & typography
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Dev server configuration with GLB streaming
├── start-website.bat            # One-click launcher for Windows
├── src/
│   ├── main.js                  # Main application orchestrator & UI handlers
│   ├── modelsData.js            # Comprehensive lore, stats & metadata for all 26 models
│   ├── viewer3d.js              # Three.js WebGL 3D scene, lighting, camera & controls
│   ├── audioEngine.js           # Procedural Web Audio hearth & arcane soundscapes
│   └── style.css                # Vintage medieval fantasy styling & responsive rules
└── *.glb                        # 26 3D models (PixelLabs, Aberrant Realities, Tripo)
```
