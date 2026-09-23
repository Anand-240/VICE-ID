# VICE ID

> Build your identity. Edit your image. Let the city react.

**VICE ID turns image editing into the starting point of a playable identity-and-reputation story.** Create a fictional character, customise their portrait with [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor), turn that portrait into a wanted poster, and publish it across Vice Coast. Explore the city, see simulated public and police reactions, and leave with a downloadable identity card.

Built for the **Build with React Image Editor Challenge**.

**#BuiltWithImageEditor**

[Launch VICE ID](https://viceid.vercel.app) · [Source code](https://github.com/Anand-240/VICE-ID) · [React Image Editor](https://github.com/unlayer/react-image-editor)

## Demo Video

Watch the complete journey from character creation and React Image Editor customisation to wanted poster publishing, city reactions, playable districts, and police pursuit gameplay.

[![Watch the VICE ID project demo](https://img.youtube.com/vi/e4qh5EbIwJo/hqdefault.jpg)](https://youtu.be/e4qh5EbIwJo)

[Watch the full VICE ID demo on YouTube](https://youtu.be/e4qh5EbIwJo)

## The idea

Most image-editing experiences end with a download. VICE ID asks: **what happens after the image is published?**

Here, your edit becomes an asset inside the experience. Your portrait appears in a police dossier; your customised wanted poster appears on city displays; your character choices and gameplay contribute to a fictional reputation. The final VICE ID brings your edited identity and the city's response together.

The visual direction combines a neon coastal city, police-record interfaces, terminal-style inputs, and original illustrated district and lifestyle cards. It draws inspiration from GTA-style urban storytelling, but uses fictional places and procedural game characters rather than GTA character models.

## React Image Editor is the core creative tool

VICE ID uses the official **`@unlayer/react-image-editor`** package, not a look-alike toolbar. It is embedded in two connected stages:

| Editor session | Starting image | What the player does | Where the result goes |
| --- | --- | --- | --- |
| **VICE Studio** | Uploaded portrait | Crop, resize, filter, draw, add text, shapes, stickers or frames | Dossier, wanted-poster composition and final identity card |
| **Wanted Poster Studio** | Generated wanted poster containing the edited portrait | Customise the complete poster before publishing | Poster preview, city displays, playable districts and poster download |

### How the integration works

The shared [ViceImageEditor component](src/components/editor/ViceImageEditor.tsx) wraps the official editor and connects it to the rest of the application.

- **Native tools:** crop, resize, filters, drawing, text, shapes, stickers and frames are enabled inside the editor.
- **Real image exports:** the editor's `onSave({ dataUrl })` callback saves the result. External actions such as **Lock Identity**, **Save & Preview** and **Publish to City** also use the editor instance's `getImage()` method to capture the current canvas.
- **Shared state:** the exported portrait is stored as `editedImage`; the exported poster is stored as `wantedPosterImage`. Subsequent screens consume those images.
- **Session continuity:** the source image stays fixed while an editing session is mounted, so saving does not reload the canvas and discard that session's editing history.
- **Recovery:** loading states, error messages, a loading timeout and retry support help recover from editor failures. Export-dependent actions wait until the editor is ready.
- **Responsive access:** on narrow screens, the native editor sits in a horizontally scrollable workspace so its tools remain reachable.

The image pipeline is:

```text
Uploaded portrait
  → React Image Editor: portrait editing
  → Saved edited portrait
      → Police dossier
      → Final VICE ID composition
      → Wanted-poster composition
          → React Image Editor: poster customisation
          → Saved customised poster
              → City preview and 3D poster surfaces
              → Wanted-poster download
```

**What the app adds around the editor:** VICE ID uses the browser Canvas API to compose the initial wanted-poster layout and final identity card. React Image Editor handles the player's image-editing work. The city simulation and 3D gameplay are separate systems that use the saved assets and character state.

Saved images are flattened exports. Editable layers and undo history are not persisted across separate editor sessions. The project does not use image analysis to calculate reputation or identify faces.

## The complete experience

### 1. Register your identity

Enter a name, alias and optional crew through terminal-styled form fields. Upload a JPG, PNG or WebP portrait, choose a district and lifestyle, and set a one-to-five-star wanted level.

The creator shows a live preview with heat, reputation and style scores. These scores come from the selected district, lifestyle and wanted level. Upload validation checks file type, size and image decoding, with limits of 15 MB and 40 megapixels.

The terminal presentation still uses normal text inputs, including keyboard editing and paste. On desktop, the preview stays visible while you browse the choices.

### 2. Build your look in VICE Studio

Open the portrait in React Image Editor and make it your own. Select **Lock Identity** to export the current canvas and carry that edited portrait into the story.

### 3. Review the VMPD dossier

Your character becomes a fictional police intelligence record with an edited portrait, case ID, bounty, wanted status and reputation details.

Explore **Overview**, **Activity**, **Known Locations** and **Evidence**. The dossier connects the identity, district, poster and later city updates rather than displaying an unrelated profile.

### 4. Create and customise your wanted poster

**Issue Wanted Poster** generates a 1080 × 1350 composition from your edited portrait and character details.

Choose **Customize Poster** to open the second React Image Editor session. Add your own text, marks, stickers, filters or other edits, then preview, download or publish the actual result. Resizing in the editor can change the poster's dimensions.

### 5. Publish to City Impact

Publishing initialises a local city simulation: poster reach, sightings, buzz, police attention and a chronological event feed.

Select districts on the city map, inspect their response, or simulate the next hour. From here, enter a playable district or continue directly to the social feed.

### 6. Enter a playable district

Explore a third-person, stylised 3D environment with pedestrians, patrol officers, a minimap, objectives and your customised poster on in-world displays.

The seven districts have distinct environment configurations, landmarks, palettes and layouts:

| District | Identity |
| --- | --- |
| **Ocean Heights** | Luxury coastal towers and beach-club surroundings |
| **Neon Harbor** | Cargo docks, industrial structures and neon nightlife |
| **Sunset Strip** | Entertainment streets, clubs and illuminated signs |
| **Coral Bay** | Marina scenery, waterfront leisure and yacht-club atmosphere |
| **Little Palma** | Local shops, market details and neighbourhood street culture |
| **Downtown Vice** | Corporate towers and dense urban surroundings |
| **South Point** | Warehouses, garages and industrial racing atmosphere |

Movement uses Rapier physics for gravity and collisions, with acceleration, braking, grounded jumping, limited air control and stamina-based sprinting. The camera follows movement and checks for obstructions.

NPC encounters and police detection produce simulated recognition and awareness events. Patrols accelerate as awareness rises; reaching **100% police awareness** starts an actionable confrontation with pursuit or surrender choices. Escape, capture and other district results feed back into the wider city state.

Select **Start Exploring** after loading to begin. Poster displays activate progressively during active gameplay; billboard publication is not tied to reaching 100% police awareness.

### 7. See the response in VICEFEED

A fictional social feed reflects the character, publication and recorded city outcomes. Browse reactions, toggle likes, and use the available share and download actions.

This is a local narrative simulation, not a live social network.

### 8. Claim your VICE ID

Generate a 1080 × 1350 final identity card containing your edited portrait and story details. Download the card, view or download your customised wanted poster, share where the browser supports it, or restart with a new identity.

## Try the full editor-to-world loop

1. Open [VICE ID](https://viceid.vercel.app) and enter the creator.
2. Upload a portrait, enter a name and alias, and select your character options.
3. Choose **Build My Look**, make a visible edit, then **Lock Identity**.
4. Open the dossier and select **Issue Wanted Poster**.
5. Choose **Customize Poster** and add something recognisable, such as a text label or sticker.
6. **Save & Preview**, then **Publish to City**.
7. Enter a district, select **Start Exploring**, and find your published poster.
8. Complete or leave the district, continue through VICEFEED, and download your final VICE ID and poster.

This path demonstrates both editor sessions and how their outputs remain connected to the rest of the project. No application account or login is required.

## Gameplay controls

| Action | Desktop |
| --- | --- |
| Move | WASD or arrow keys |
| Rotate camera | Drag inside the game |
| Sprint | Hold Shift; uses stamina |
| Jump | Space |
| Interact near a poster | E |
| Pause / resume | Escape or the on-screen control |

Touch controls provide movement, run, jump and interaction buttons on supported mobile layouts. The interface also provides district exit and pursuit-result actions.

## Technology and project structure

| Technology | Role |
| --- | --- |
| React 18 + TypeScript | Interface, screen flow and typed application state |
| Vite | Development server and production build |
| Unlayer React Image Editor | Portrait and wanted-poster editing |
| Zustand | Shared character, publication and gameplay state |
| IndexedDB | Browser-local persistence, including exported images |
| Canvas API | Wanted-poster and final-card composition |
| Three.js + React Three Fiber + Drei | Playable 3D districts and scene rendering |
| React Three Rapier | Game physics |
| Framer Motion | Interface transitions |
| Lucide | Interface icons |

Key implementation files:

```text
src/
├── App.tsx                         Main journey and screen integration
├── components/
│   ├── editor/ViceImageEditor.tsx   Official editor wrapper and export bridge
│   ├── IdentityTerminal.tsx        Terminal-styled identity inputs
│   ├── TerminalSequence.tsx        Typed transition presentation
│   ├── DistrictArtwork.tsx         Original district illustrations
│   └── LifestyleArtwork.tsx        Original lifestyle illustrations
├── game/
│   ├── ViceDistrictGame.tsx        Gameplay flow, awareness and outcomes
│   ├── NeonHarborScene.tsx         Shared district scene, characters and physics
│   ├── DistrictMinimap.tsx         In-game minimap
│   └── districts.ts               Seven district configurations
├── lib/
│   ├── image.ts                   Poster and final-card composition
│   ├── city.ts                    City simulation
│   ├── scoring.ts                 Scores, bounty and character-derived text
│   └── storage.ts                 IndexedDB storage and memory fallback
├── store/characterStore.ts         Shared state and persistence
├── styles.css                     Base interface styles
├── visual-polish.css              Visual refinements and responsive layouts
└── terminal.css                   Identity console styling
tests/
└── city.test.mjs                   Simulation and configuration regression tests
```

Despite its filename, `NeonHarborScene.tsx` renders the shared scene system for all seven district configurations.

## Run locally

Use **Node.js 22.6 or newer** and npm. An internet connection is needed for the external editor runtime and assets; the optional 3D experience requires WebGL.

```bash
git clone https://github.com/Anand-240/VICE-ID.git
cd VICE-ID
npm ci
npm run dev
```

Open the local URL printed by Vite.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Run TypeScript checks and build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the simulation and configuration tests |

The automated tests cover city publication, simulated time rollover, district configurations, score bounds and bounty progression. They do not replace browser testing of the external editor, downloads, touch controls or 3D gameplay.

### Deploy to Vercel

Use the **Vite** preset, the repository root as the root directory, `npm run build` as the build command and `dist` as the output directory. No project-specific environment variables are required for the current implementation.

After deploying, test the complete upload → edit → poster → publish → gameplay → download journey on the public URL, including the external editor loading successfully.

## Persistence, recovery and scope

- **Local progress:** character details, exported images, city state and completed district outcomes are saved in IndexedDB in the same browser and origin. They are not synced between devices.
- **Storage fallback:** if persistent storage is unavailable, the app uses memory storage; progress may be lost when the page closes.
- **Gameplay reloads:** refreshing during a district returns to City Impact instead of restoring an in-progress physics simulation.
- **Failure handling:** upload validation, editor retry, prerequisite checks, generation errors and a 3D scene fallback provide recovery paths.
- **Responsive interface:** adaptive grids, a desktop sticky preview, labelled inputs, keyboard focus styles, reduced-motion support and mobile game controls support different ways of using the app.
- **External dependencies:** the app has no custom backend, but the editor runtime and fonts depend on external services. Browser-local persistence does not make the complete experience offline.
- **Simulated world:** police records, recognition, engagement figures and city events are fictional. Reputation is calculated from choices and events, not analysis of the uploaded image.
- **Game scope:** this is a browser-based creative experience with a lightweight playable city, not a full open-world GTA game. The uploaded portrait does not generate a 3D avatar.
- **Browser differences:** WebGL performance, native sharing and clipboard availability depend on the device, browser and permissions.

## Credits

- Image editing: [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor)
- 3D rendering and physics: Three.js, React Three Fiber, Drei and Rapier
- Interface icons: [Lucide](https://lucide.dev/)
- Typography: Anton, Manrope and IBM Plex Mono
- Visual assets: project-specific generated artwork, original SVG district and lifestyle illustrations, and procedural 3D scenes

VICE ID is an independent, GTA-inspired project and is not affiliated with Rockstar Games.

**Built with React Image Editor. Built around what happens after you edit.**
