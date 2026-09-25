# VICE ID

> Build your identity. Edit your image. Let the city react.

Most image editors end the moment you hit save. VICE ID starts there.

You create a character, edit their portrait with [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor), and that exact export becomes a wanted poster across a fictional city called Vice Coast. Then you walk into that city in 3D and live with it. Pedestrians recognise the face you made. A witness calls it in. VMPD starts looking for you.

The editor does not stay behind on the previous screen. Inside the district there is a **Draw / Edit** dock that is open from the first frame and never goes away. Stand in front of a wall, a shutter, a notice panel or almost any upright surface, and the editor opens on that surface. Your strokes land on it in 3D while the street keeps moving around you. Then a camera logs the mark, a ten second dispatch clock starts, and you are standing still while you draw.

Built for Unlayer's [Build with React Image Editor Challenge](https://www.linkedin.com/posts/builtwithimageeditor-ugcPost-7501266289240240128-5qRa/).

**#BuiltWithImageEditor**

[Play it](https://viceid.vercel.app) · [Source](https://github.com/Anand-240/VICE-ID) · [React Image Editor](https://github.com/unlayer/react-image-editor)

## Where the editor shows up

There are five places you open React Image Editor, and every one of them feeds something downstream.

| Session | You start from | What you get |
| --- | --- | --- |
| **VICE Studio** | Your uploaded portrait | The edited portrait, used in the police dossier, the wanted poster and the final ID card |
| **Wanted Poster Studio** | The generated poster, portrait already in it | The published poster: street panels, billboard, dossier evidence, VICEFEED, download |
| **Street Signal Studio** | A brick wall, shutter or notice panel | Live paint on that surface in 3D, plus a street signal other characters react to |
| **Free-surface painting** | A blank transparent canvas pinned to whatever you are facing | A mark stuck to that exact spot in the world |
| **In-game poster remix** | The poster currently on the streets | Every poster stand and the billboard in this run, repainted |

## Walkthrough

The first screenshots are the identity and poster journey. The later ones show street painting, which is the newest part. Click any image for the full size.

<p align="center">
  <a href="docs/screenshots/01-landing.webp">
    <img src="docs/screenshots/01-landing.webp" alt="VICE ID landing page overlooking Vice Coast" width="100%">
  </a>
</p>
<p align="center"><sub><b>Enter Vice Coast</b> and begin building the identity the city will remember.</sub></p>

### 1. Create the identity

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/02-identity-registration.webp"><img src="docs/screenshots/02-identity-registration.webp" alt="VICE ID terminal style identity registration form" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/03-character-options.webp"><img src="docs/screenshots/03-character-options.webp" alt="VICE ID district and lifestyle selection cards" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Identity registration</b><br><sub>Enter a name, alias and optional crew while the live preview updates.</sub></td>
    <td align="center"><b>District and lifestyle</b><br><sub>Select one of seven districts and a reputation profile.</sub></td>
  </tr>
</table>

### 2. Edit the portrait with React Image Editor

<p align="center">
  <a href="docs/screenshots/04-react-image-editor.webp">
    <img src="docs/screenshots/04-react-image-editor.webp" alt="Official React Image Editor integrated into VICE Studio" width="100%">
  </a>
</p>
<p align="center"><sub><b>VICE Studio</b> embeds the official React Image Editor with crop, resize, filters, drawing, text, shapes, stickers and frames.</sub></p>

### 3. Turn the edit into a city asset

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/05-wanted-poster.webp"><img src="docs/screenshots/05-wanted-poster.webp" alt="Generated wanted poster ready for a second editor pass" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/06-city-impact.webp"><img src="docs/screenshots/06-city-impact.webp" alt="Interactive City Impact map and selected district details" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Wanted Poster Studio</b><br><sub>Customise, save and publish the generated poster.</sub></td>
    <td align="center"><b>City Impact</b><br><sub>Track sightings, police units, social buzz and district activity.</sub></td>
  </tr>
</table>

### 4. Enter a playable district

<p align="center">
  <a href="docs/screenshots/07-district-entry.webp">
    <img src="docs/screenshots/07-district-entry.webp" alt="Sunset Strip entry screen with gameplay controls" width="100%">
  </a>
</p>
<p align="center"><sub><b>District entry</b> introduces movement, camera, sprint, jump and interaction controls before the simulation begins.</sub></p>

#### The poster becomes part of the world

VICE ID places the published wanted poster inside the selected 3D district. The initial layout combines the edited portrait with the character's alias, wanted level, district, profile and reward. Opening **Customize Poster** lets the player edit that whole composition with Unlayer React Image Editor. Any saved text, stickers, drawing, filters or frames become part of the image displayed in the city. Players can also publish the initial composition without this optional second editing session.

<p align="center">
  <a href="docs/screenshots/08-city-gameplay.webp">
    <img src="docs/screenshots/08-city-gameplay.webp" alt="The customised wanted poster displayed on a street panel and a large billboard in playable Sunset Strip" width="100%">
  </a>
</p>
<p align="center"><sub><b>One editor export, multiple city surfaces.</b> The street panel on the right presents a close physical copy while the distant billboard broadcasts the same wanted poster across Sunset Strip.</sub></p>

| Poster presence | Purpose inside the experience |
| --- | --- |
| **Street panels and poster stands** | Make the edited asset discoverable at pedestrian level and give the player something physical to approach and inspect. |
| **District billboard** | Displays the published poster after 25 seconds of active gameplay, or earlier when local buzz reaches 90. |
| **Nearby witnesses** | Posters create suspicion. Once the player publishes a wall mark, nearby witnesses can report the character's location. |
| **Police response** | The first wall stroke detected by the live editor starts a ten-second delay. Dispatch then investigates and sightings increase awareness. Poster recognition alone does not start pursuit; firing a weapon reports the player's location immediately. |
| **Persistent visual identity** | The same saved poster appears in the city preview, dossier evidence, VICEFEED and poster downloads. The final identity card separately uses the edited portrait and updated story details. |

Recognition is a fictional gameplay simulation based on poster activation, proximity and line of sight. The application does not analyse the uploaded face or perform real facial recognition.

### 5. Face the consequences

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/09-police-contact.webp"><img src="docs/screenshots/09-police-contact.webp" alt="Police officer identifying the player during gameplay" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/10-active-pursuit.webp"><img src="docs/screenshots/10-active-pursuit.webp" alt="Active VMPD pursuit at one hundred percent police awareness" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Police awareness</b><br><sub>Visual contact increases awareness according to distance and exposure.</sub></td>
    <td align="center"><b>Active pursuit</b><br><sub>Break line of sight and remain hidden to escape VMPD.</sub></td>
  </tr>
</table>

<p align="center">
  <a href="docs/screenshots/11-apprehended.webp">
    <img src="docs/screenshots/11-apprehended.webp" alt="VICE ID apprehended outcome screen" width="100%">
  </a>
</p>
<p align="center"><sub><b>District outcome</b> records the arrest in the city story or lets the player retry.</sub></p>

### 6. Latest gameplay: from editor canvas to city surface

These screenshots show the current street-editing flow. The important connection is visible in the painting views: the image being edited with **[Unlayer React Image Editor](https://github.com/unlayer/react-image-editor)** on the right becomes artwork on the 3D surface on the left. Unlayer provides the image tools; VICE ID exports the canvas and applies it to the scene.

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/12-draw-edit-dock.webp"><img src="docs/screenshots/12-draw-edit-dock.webp" alt="Editing available from the start" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/13-surface-text.webp"><img src="docs/screenshots/13-surface-text.webp" alt="Text on a street surface" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Editing available from the start</b><br><sub>The Draw / Edit dock lists the wanted poster and prepared painting surfaces beside the district controls.</sub></td>
    <td align="center"><b>Text on a street surface</b><br><sub>Unlayer's Text tool edits a transparent canvas whose exported image is attached to the surface in front of the character.</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/14-wall-drawing.webp"><img src="docs/screenshots/14-wall-drawing.webp" alt="Freehand art on the Canal service wall" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/15-shutter-shapes.webp"><img src="docs/screenshots/15-shutter-shapes.webp" alt="Shapes on the Market shutter" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Freehand art on the Canal service wall</b><br><sub>The Unlayer Draw tool creates brush strokes; periodic exports update the wall while the district keeps running.</sub></td>
    <td align="center"><b>Shapes on the Market shutter</b><br><sub>A shape created in Unlayer React Image Editor appears on the shutter texture in the same scene.</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/16-notice-panel-text.webp"><img src="docs/screenshots/16-notice-panel-text.webp" alt="Messages on the Club notice panel" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/17-mark-live.webp"><img src="docs/screenshots/17-mark-live.webp" alt="Your mark is live" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Messages on the Club notice panel</b><br><sub>Unlayer's Text tool adds lettering to the panel. Signal Purpose controls the gameplay meaning separately from the written words.</sub></td>
    <td align="center"><b>Your mark is live</b><br><sub>The artwork remains on the street surfaces after closing the editor. The first mark starts the dispatch countdown.</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/18-armed-pursuit.webp"><img src="docs/screenshots/18-armed-pursuit.webp" alt="Pursuit and automatic escape boost" width="100%"></a></td>
    <td width="50%"><a href="docs/screenshots/19-downed.webp"><img src="docs/screenshots/19-downed.webp" alt="A consequence recorded in the city story" width="100%"></a></td>
  </tr>
  <tr>
    <td align="center"><b>Pursuit and automatic escape boost</b><br><sub>The editing dock remains available during pursuit. Weapon use reveals your position and can provoke return fire.</sub></td>
    <td align="center"><b>A consequence recorded in the city story</b><br><sub>The Downed screen follows loss of health. Accept the outcome to view its impact or retry the district.</sub></td>
  </tr>
</table>

The drawing tools are not decorative controls. The exported artwork remains visible when the editor closes. The pursuit and outcome screenshots show the surrounding game loop, not features supplied by the image editor itself.

## What it does well

**The editor is the whole game, not a step in it.** Five separate sessions, and each one changes something you can walk up to afterwards. The poster you customise is the poster on the billboard. The wall you paint is the wall people report you for.

**Painting happens live, in 3D.** Open a surface and the editor sits beside the scene. Every changed export lands on that surface about once a second while patrols keep walking past. You watch the wall fill in as you draw it.

**Almost anything upright is a canvas.** Three prepared walls plus any surface you can stand in front of. A raycast checks the angle and reach, then pins a transparent canvas to that exact spot at the right orientation. Floors and ceilings are out, everything else is fair game.

**The police actually think.** Line of sight detection with real ray casts, A* pathfinding that routes them around buildings instead of through them, awareness that builds with distance and exposure, and a dispatch system that only knows where you were last seen. Crouch and they spot you at 62% of their usual range.

**Movement is built on real physics.** Rapier handles gravity and collision. On top of that: acceleration limited velocity so you build speed and brake, coyote time after a ledge, jump buffering, a jump cut so a tap is smaller than a hold, and step-up so kerbs do not stop you dead.

**Choices carry weight.** Painting starts a clock. Firing skips it entirely and pins your location. Hit a bystander and the street scatters while your record gets worse. Five seconds after your first shot the response arms up and shoots back.

**Seven districts**, each with its own layout, landmarks, palette and atmosphere, all running through one shared scene system.

**Recognition is simulated, by design.** Nothing analyses your photo. Whether someone recognises you comes down to poster activation, proximity and line of sight, which keeps it a game mechanic you can read and play around rather than a black box.

**Runs entirely in the browser.** No backend, no account, no login. Your character, images and progress are kept in your own browser with IndexedDB, with a memory fallback if storage is blocked.

**Built to degrade gracefully.** A WebGL check with a real fallback screen, editor load timeouts with retry, upload validation, and reduced motion support.

**42 logic tests** covering the city simulation, police detection and pathfinding, wall response timing, movement and escape speeds, paintable surfaces and weapon state. They run in Node with `npm test`.

## Try the loop in two minutes

1. Open [viceid.vercel.app](https://viceid.vercel.app) and enter the creator.
2. Upload a portrait, fill in a name and alias, pick a district.
3. **Build My Look**, make a visible edit, **Lock Identity**.
4. In the dossier, **Issue Wanted Poster**, then **Customize Poster** and add something obvious like text or a sticker.
5. **Save & Preview**, then **Publish to City**.
6. Enter a district, **Start Exploring**, and go find your poster on the street.
7. Open **Draw / Edit**, pick a wall, and draw. Watch it appear on the wall behind the panel. The first stroke starts the ten second clock, so **Stop and Run** before it ends.
8. Walk up to any other upright surface and press **E** to paint that instead.
9. Finish or leave the district, go through VICEFEED, and download your ID card and poster.

No account, no login.

## How the editor is wired in

Everything goes through one wrapper, [`ViceImageEditor.tsx`](src/components/editor/ViceImageEditor.tsx), which mounts `@unlayer/react-image-editor` and bridges its exports into the rest of the app.

All eight native tools are on: crop, resize, filters, draw, text, shapes, stickers and frames. Nothing is reimplemented on top.

**Exports.** `onSave({ dataUrl })` handles saves. Lock Identity, Save & Preview and Publish call the editor instance's `getImage()` directly to grab the current canvas.

**Live painting.** This is the part worth explaining, because it is not a feature of the editor. While a surface is open, the app checks `hasChanges()` and pulls a `getImage()` export every 850 ms through a non-throwing `peekImage()` wrapper. Each changed export is written onto that surface's texture as a `CanvasTexture`. So you are not painting in 3D inside Unlayer. You are painting on a normal 2D canvas, and the app keeps copying the result onto the wall about once a second. The 850 ms cadence is a tradeoff: faster feels more live but calls `toDataURL` more often.

**Why `peekImage` exists.** The normal export path shows an error panel if it fails, which is right for a button press and wrong for a poll. `peekImage` swallows the failure and skips that frame instead of tearing down the editor mid-drawing.

**Session continuity.** The source image is frozen for the life of an editing session, so saving does not reload the canvas and throw away that session's undo history.

**Storage.** The portrait export lives in `editedImage`, the poster in `wantedPosterImage`, both in Zustand and persisted to IndexedDB. Street art and in-game poster remixes are deliberately run-local and are not persisted.

The pipeline:

```text
Uploaded portrait
  → React Image Editor (portrait)
  → editedImage
      → dossier, final ID card
      → wanted poster composition
          → React Image Editor (poster, optional)
          → wantedPosterImage
              → street panels, billboard, VICEFEED, download
              → React Image Editor (in-run remix)

Wall texture or blank surface canvas
  → React Image Editor (draw, text, shapes, stickers)
  → export every 850 ms
  → live 3D surface texture
  → Publish Signal: message or false trail
```

The app composes the initial poster layout and the final ID card with the plain Canvas API. Everything a player actually edits is done by React Image Editor.

## Playing it

Movement runs on Rapier physics. Velocity is acceleration limited rather than snapped to a target, so you build speed and have to brake. There is coyote time after leaving a ledge, a jump buffer so an early press still fires on landing, a jump cut so a tap is a smaller hop than a hold, and step-up so kerbs do not stop you.

| Action | Key |
| --- | --- |
| Move | WASD or arrows |
| Camera | Drag |
| Sprint | Shift, costs stamina |
| Jump | Space |
| Crouch | Hold C |
| Paint the surface in front of you, or inspect a poster | E |
| Reopen the last thing you edited | Q |
| Leave a wall mid-paint | Escape, or Stop and Run |
| Draw or holster the pistol | G |
| Aim | Hold right mouse, or toggle F |
| Fire while aiming | Left click or Control |
| Reload | R |
| Pause | Escape |

Touch layouts get movement, run, jump, crouch, interact, aim and fire buttons, plus the same Draw / Edit dock.

**Getting noticed.** Posters alone only make people suspicious. Painting a surface is what creates a reportable incident: the first stroke starts a ten second clock, then dispatch investigates. Witnesses who see you near a mark can report your position. Police awareness climbs when an officer has line of sight, faster the closer they are.

**Crouching** drops you to a lower profile and officers spot you at 62% of their normal range, and identify you about 40% slower once they do.

**Running.** Past 50% awareness, or during a pursuit, escape speed engages on its own at 8.5 units per second against a pursuing officer's 6.1. No Shift, no stamina drain. You are meant to be able to outrun them.

**The gun is optional and it is a bad idea.** Firing reports your position immediately and skips the painting grace period entirely. Hit an officer and that unit is out for fourteen seconds. Hit a bystander and the street scatters, awareness jumps much harder, and it goes on your record. Five seconds after your first shot VMPD arms, two more units roll out, and they close to nine metres before holding and shooting back. Enough return fire and you are Downed instead of arrested.

**Escaping.** At 100% awareness pursuit starts. Break line of sight, get below 55%, and stay unseen for five seconds.

Street art, free-surface marks and poster remixes last for the current district run and clear on restart. Painting does not pause the world. The pause menu and the poster editor do.

## Run locally

Node 22.6 or newer, because the test runner uses `--experimental-strip-types` to run TypeScript directly. You need a connection for the editor runtime and fonts, and WebGL for the 3D district.

```bash
git clone https://github.com/Anand-240/VICE-ID.git
cd VICE-ID
npm ci
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type check, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the logic tests |

React 18 and TypeScript on Vite. Zustand for state, IndexedDB for persistence, Canvas API for composing the poster and ID card. Three.js with React Three Fiber, Drei and Rapier for the district. Framer Motion and Lucide for the interface.

### Project layout

```text
src/
├── App.tsx                        Screen flow from landing to final ID
├── components/editor/
│   └── ViceImageEditor.tsx        The editor wrapper and export bridge
├── game/
│   ├── ViceDistrictGame.tsx       Gameplay flow, awareness, outcomes, HUD
│   ├── NeonHarborScene.tsx        The 3D scene, characters and physics
│   ├── locomotion.ts              Acceleration, coyote time, jump buffer, step-up
│   ├── movement.ts                Walk, sprint, crouch and escape speeds
│   ├── police.ts                  Detection, awareness, patrol pathfinding
│   ├── weapon.ts                  Ammo, hitscan, damage, armed response
│   ├── walls.ts                   Prepared walls, signals, dispatch delay
│   ├── tags.ts                    Paintable surfaces and decal placement
│   └── districts.ts               Seven district configurations
├── lib/                           Poster and card composition, city sim, storage
└── store/characterStore.ts        Shared state, persisted to IndexedDB
```

`NeonHarborScene.tsx` is badly named. It renders the shared scene for all seven districts, not just Neon Harbor.

### Tests

```
npm test
```

Seven files covering city simulation and district config, police detection and pathfinding, wall interaction and response gating, speeds and the escape boost, the locomotion model, paintable surfaces and patch limits, and weapon state.

These are logic tests. They run in Node without a browser, so they cover the rules, not the rendering. The editor itself, downloads, touch controls and anything visual still need checking by hand in a browser.

### Deploying

Vercel, Vite preset, repo root, `npm run build`, output `dist`. No environment variables.

## Against the challenge brief

| Asked for | What is here |
| --- | --- |
| An original GTA-inspired experience | A fictional coastal city where your edited identity, posters and street marks are the thing you play with |
| React Image Editor as a core component | Five editor sessions: portrait, poster, in-run poster remix, prepared walls, free surfaces. Remove it and the project has no creative loop left |
| Let users customise at least one visual | Both personal images and city surfaces, using the editor's own tools |
| Public repo and clear docs | [This repository](https://github.com/Anand-240/VICE-ID) |
| A deployed link | [viceid.vercel.app](https://viceid.vercel.app) |
| Show the experience | The screenshots above |

This README describes what the code does. It does not claim the submission form or social post steps are done.

## Credits

Image editing by [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor). 3D with Three.js, React Three Fiber, Drei and Rapier. Icons from [Lucide](https://lucide.dev/). Type is Anton, Manrope and IBM Plex Mono. District and lifestyle illustrations are original SVG work, the 3D scenes are procedural, and portraits come from whoever is playing.

Independent project, GTA inspired, not affiliated with Rockstar Games.
