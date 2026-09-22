# VICE ID

> **Build your identity. Shape your reputation. Let the city react.**

VICE ID is an original, GTA-inspired identity and reputation experience created for the **Build with React Image Editor Challenge**.

The player creates a fictional Vice Coast character, edits their visual identity with the official [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor), turns that identity into a wanted poster, and publishes it into a simulated city. The same edited visual then appears in a police dossier, city intelligence system, social feed, seven playable 3D districts, and a downloadable final VICE ID.

VICE ID is designed as an in-world game feature rather than a standalone image generator: what the player creates becomes part of the world, attracts public attention, changes police awareness, and affects the final story.

## Submission

- **Live experience:** [Add deployed URL]
- **Source code:** [Add public GitHub URL]
- **Walkthrough:** [Add video or screenshots URL]
- **Challenge:** Build with React Image Editor
- **Hashtag:** **#BuiltWithImageEditor**

## The idea

What if character creation did not end when the player selected a face?

VICE ID treats identity as a gameplay system:

```text
Create a character
        ↓
Edit their visual identity
        ↓
Generate and customize a wanted poster
        ↓
Publish the poster across Vice Coast
        ↓
Trigger social and police reactions
        ↓
Enter a district and face the consequences
        ↓
Export the final VICE ID
```

The edited image is not discarded after export. It becomes a persistent city asset used throughout the complete experience.

## Main experience

### 1. Create an identity

The player defines:

- name and alias;
- optional crew;
- home district;
- lifestyle and reputation profile;
- one-to-five-star wanted level;
- uploaded JPG, PNG, or WebP portrait.

VICE ID validates the uploaded file and generates character-specific heat, reputation, style, status, bounty, headlines, and city behavior.

### 2. Edit the character in VICE Studio

VICE Studio embeds the official React Image Editor. The player can use its native:

- crop and resize tools;
- filters and image adjustments;
- drawing tools;
- text layers;
- shapes;
- stickers;
- frames;
- undo, redo, zoom, reset, save, and cancel controls.

Locking the identity exports the real editor canvas into the shared character state.

### 3. Open the police dossier

The edited character becomes a VMPD intelligence record containing:

- the edited portrait and player identity;
- dynamically generated scores and wanted status;
- incident activity;
- known locations;
- evidence connected to the published poster;
- city and gameplay updates recorded later in the story.

The Overview, Activity, Known Locations, and Evidence sections are interactive.

### 4. Generate and customize a wanted poster

VICE ID generates a 1080 × 1350 wanted poster from the player's edited portrait, alias, district, wanted level, lifestyle, case ID, and calculated bounty.

The poster then enters a second React Image Editor session, allowing the player to customize it before previewing, downloading, or publishing it.

### 5. Publish the identity to Vice Coast

Publishing is a real state transition. It initializes a city simulation with:

- heat, reputation, buzz, and police attention;
- poster reach and sightings;
- police-unit activity;
- affected districts;
- a chronological city event feed.

The player can simulate additional hours and watch these values evolve.

### 6. Enter any of seven playable districts

Every selectable location opens a working 3D district with its own layout, visual identity, landmarks, roads, colors, spawn point, and atmosphere:

- Ocean Heights;
- Neon Harbor;
- Sunset Strip;
- Coral Bay;
- Little Palma;
- Downtown Vice;
- South Point.

The scene uses React Three Fiber, Three.js, and Rapier physics. The player can walk or run, rotate the camera, collide with the environment, inspect their exact poster in the world, encounter roaming NPCs, and attract police attention.

At 100% police awareness, the experience triggers an active response: the player can run and break line of sight or surrender. The result updates the shared city state, police dossier, social reactions, and final identity.

### 7. Watch the city react

VICEFEED presents the player-created identity as a fictional in-world social story. Its poster, avatar, reach, comments, headlines, heat, and police reactions are derived from the current character, city, and district outcome.

VICEFEED is an intentional local simulation—there is no real social network or policing service.

### 8. Export the final VICE ID

The final screen combines the edited identity with the consequences of the story:

- alias and character name;
- lifestyle and district;
- wanted level;
- heat, reputation, and style;
- public poster reach;
- affected districts;
- final city status and last-seen outcome.

The player can download the 1080 × 1350 VICE ID, preview or download the wanted poster, use supported native sharing, or restart with a new story.

## Why React Image Editor is central

VICE ID uses the official `@unlayer/react-image-editor` package. It is integrated in [ViceImageEditor.tsx](src/components/editor/ViceImageEditor.tsx) and appears at two essential points:

1. editing and locking the character's visual identity;
2. customizing the generated wanted poster before publication.

The integration uses the supported editor instance and callbacks:

- `getImage()` for the current exported canvas;
- `reset(image)` for restoring the source;
- `onLoad` and `onLoadError`;
- `onSave({ dataUrl })`;
- `onCancel`;
- `onError`.

Two shared image values connect the complete product:

| State | Created by | Reused in |
|---|---|---|
| `character.editedImage` | VICE Studio | Police Dossier, wanted-poster generator, VICEFEED avatar, final VICE ID |
| `character.wantedPosterImage` | Poster editor | Evidence, City Impact, VICEFEED post, downloads, in-world posters and billboards |

Removing React Image Editor would break the core identity-creation and publication loop. It is a gameplay mechanic, not a decorative embed.

## Challenge alignment

VICE ID addresses the challenge requirements through:

- an original fictional crime-world experience that can be imagined as an in-game activity;
- official React Image Editor integration as a core mechanic;
- real user-controlled visual editing and export;
- reuse of the edited result across the entire experience;
- dynamic city, police, social, and gameplay consequences;
- downloadable, shareable final visuals;
- a public-repository-ready React project and deployment-ready Vite build.

This project does not include Rockstar logos, official GTA characters, copied maps, or downloaded GTA game assets. Its Vice Coast setting, VMPD systems, procedural 3D environments, interface, and game loop are original and independently created. GTA is referenced only as creative inspiration.

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Move | WASD or arrow keys | Direction pad |
| Run | Hold Shift | Run button |
| Rotate camera | Drag pointer | Drag |
| Inspect nearby poster | E | Use button |
| Pause | Escape or pause button | Pause button |

At full police awareness, use the on-screen **Run** or **Surrender** action.

## Technology

- React 18 and TypeScript
- Vite
- [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor)
- Zustand
- Framer Motion
- Three.js and React Three Fiber
- React Three Drei
- Rapier physics
- Lucide React
- Canvas-based PNG generation
- IndexedDB session and image persistence

No backend, authentication, API key, or user account is required. Uploaded and edited images remain in the user's browser.

## Project structure

```text
src/
├── App.tsx                         Main product flow and screen components
├── components/
│   ├── editor/ViceImageEditor.tsx Official editor integration
│   └── SceneErrorBoundary.tsx     Recoverable 3D scene errors
├── game/
│   ├── ViceDistrictGame.tsx       Gameplay, objectives, pursuit, and outcomes
│   ├── NeonHarborScene.tsx        3D world, physics, characters, and posters
│   ├── DistrictMinimap.tsx        District-aware minimap
│   └── districts.ts               Seven district themes and configurations
├── lib/
│   ├── city.ts                    City-impact simulation
│   ├── image.ts                   Poster and final-card generation
│   ├── scoring.ts                 Scores, bounty, case ID, and headlines
│   └── storage.ts                 IndexedDB persistence with memory fallback
├── store/characterStore.ts        Shared identity, city, and outcome state
└── styles.css                     Responsive product design system
```

## Run locally

Requirements:

- Node.js 22.6 or newer;
- npm;
- an internet connection for the Unlayer editor runtime and editor assets;
- WebGL for the optional playable districts.

Install and start:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

Create a production build:

```bash
npm run build
npm run preview
```

Run the regression tests:

```bash
npm test
```

The tests cover city initialization, simulated time rollover, district configuration, score bounds, and bounty progression across all creator combinations.

## Quick judging path

1. Select **Enter VICE ID**.
2. Enter a name and alias, choose a district and profile, and upload a portrait.
3. Select **Build My Look**.
4. Make a visible edit in VICE Studio and select **Lock Identity**.
5. Explore the dossier, then select **Issue Wanted Poster**.
6. Select **Customize Poster**, make another edit, and save the preview.
7. Select **Publish to City**.
8. Explore City Impact or enter any district.
9. Continue to VICEFEED and claim the final VICE ID.
10. Download the final card and wanted poster.

No login, backend, or account setup is required.

## Persistence and recovery

Character data, edited images, wanted poster, city state, and completed gameplay outcome persist in IndexedDB on the same browser and origin.

VICE ID also includes recovery behavior for:

- unsupported or corrupt uploads;
- editor loading failures and retry;
- malformed or unavailable browser storage;
- missing prerequisite state;
- poster and final-card generation failures;
- unavailable WebGL or a failed 3D scene.

Refreshing during an active district returns the player to City Impact rather than attempting to restore a partially simulated 3D frame.

## Responsive design and accessibility

The interface adapts from mobile to widescreen layouts. On narrow screens, the full desktop-grade editor remains available inside a labeled horizontal workspace so no native editing tool is removed.

The experience includes semantic buttons and labels, visible keyboard focus, reduced-motion support, alternative text, touch controls, recoverable dialogs, and keyboard handling for the final poster preview.

## Deployment

VICE ID produces a static `dist/` directory and can be deployed to Vercel, Netlify, Cloudflare Pages, GitHub Pages with appropriate base configuration, or another static host.

Recommended configuration:

- build command: `npm run build`;
- output directory: `dist`;
- HTTPS enabled;
- SPA fallback to `index.html`;
- access allowed to the Unlayer CDN and Google Fonts;
- WebGL enabled for playable districts.

After deployment, verify this complete path on the public origin:

```text
upload → edit → save → poster → publish → district → VICEFEED → download
```

## Screenshots and demo

Add final submission media here:

- character creator;
- VICE Studio with a visible edit;
- police dossier;
- customized wanted poster;
- at least two visually different districts;
- 100% police-awareness action;
- VICEFEED;
- downloaded final VICE ID.

## Notes

- Police records, city events, social engagement, comments, and audience figures are fictional local simulations.
- Playable characters are original procedural low-poly figures, not GTA character models.
- Browser sharing and clipboard behavior depend on browser permissions; file download remains available.
- The 3D district bundle is loaded only when gameplay begins.

## Credits

- Image editing: [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor)
- Icons: [Lucide](https://lucide.dev/)
- Typography: Anton, Manrope, and IBM Plex Mono
- Vice Coast visual assets: project-specific generated artwork

---

Built for the **Build with React Image Editor Challenge**.

**#BuiltWithImageEditor**
