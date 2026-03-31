# Technical README

This file is meant to be a fast entry point for the next agent or developer.  
The project already includes a scene editor, cloud persistence, browser-based video export, and draft generation from a URL.

## Stable baseline

Treat the current `main` branch HEAD as the recovery baseline when future work breaks the app.

- If a new change causes regressions, compare against this baseline first.
- Do not rewrite history for this point unless explicitly requested.
- Before large refactors, create a new branch and keep this baseline easy to restore.
- If you are the next agent or developer, prefer additive changes and verify build stability before replacing core editor/export logic.

### Baseline policy for the next agent or developer

1. Start by checking what changed after this baseline.
2. If the editor, autosave, export, or URL generation breaks, use this commit as the known working reference.
3. When unsure whether a regression is old or new, assume this baseline is the last trusted state and diff from here.
4. Keep `TECHNICAL_README.md` updated when the next trusted baseline is intentionally promoted.

## What this project is

This is a Next.js 16 app for assembling short promo videos from a set of scenes.  
The user can:

- create or open a project;
- edit scenes;
- add images, logos, and author photos;
- generate a draft from a website;
- export the final result to `.mp4`;
- save the project to Supabase.

## Key commands

- `npm run dev` - local development.
- `npm run build` - production build.
- `npm run start` - run the production build.
- `npm run lint` - linting.

## Main architecture

### App Router

- [`app/page.tsx`](/d:/VideoCreatorApp/app/page.tsx) - landing page.
- [`app/editor/page.tsx`](/d:/VideoCreatorApp/app/editor/page.tsx) - editor studio.
- [`app/projects/page.tsx`](/d:/VideoCreatorApp/app/projects/page.tsx) - project list.
- [`app/api/generate-from-url/route.ts`](/d:/VideoCreatorApp/app/api/generate-from-url/route.ts) - server-side draft generation from a URL.

### Main orchestration layer

- [`components/EditorWorkspace.tsx`](/d:/VideoCreatorApp/components/EditorWorkspace.tsx) - central editor container.
- This is where the following come together:
  - project loading;
  - autosave;
  - manual save;
  - undo/redo;
  - playback preview;
  - URL-based generation;
  - video export;
  - wiring between preview, timeline, and inspector.

### Store

- [`store/useStore.ts`](/d:/VideoCreatorApp/store/useStore.ts) - Zustand store.
- The store holds:
  - `projectId`, `projectName`;
  - `sceneTrack`;
  - `selectedSceneId`;
  - `exportSettings`.
- The store also contains CRUD for scenes and data normalization.

## Data model

### Scene

A scene is described by the [`Scene`](/d:/VideoCreatorApp/lib/sceneDefinitions.ts) type.  
Key fields:

- `type`
- `durationSeconds`
- `title`, `subtitle`, `description`
- `bullets`
- `bulletEmojis`
- `bulletImageUrls`
- `websiteImageUrl`
- `logoImageUrl`
- `authorImageUrl`
- `mediaPosition`

### Scene types

The project uses:

- `brand-reveal`
- `product-showcase`
- `feature-grid`
- `slogan`
- `description`
- `website-url`
- `website-scroll`
- `quote`
- `checklist`
- `cta`

Definitions and templates live in [`lib/sceneDefinitions.ts`](/d:/VideoCreatorApp/lib/sceneDefinitions.ts).

## Scene rendering

- [`components/SceneStage.tsx`](/d:/VideoCreatorApp/components/SceneStage.tsx) - main visual scene renderer.
- It works in two modes:
  - `editable` - when the user is editing a scene;
  - `preview/export` - when the scene is being played or exported.
- `SceneStage` receives:
  - `scene`
  - `backgroundColor`
  - `textColor`
  - `preset`
  - `progress`
  - `renderLayer`
  - `performanceMode`

### Important details

- Logos and images can be uploaded as regular image files.
- Animated feature icons are rendered through Lottie.
- Logos support fit-to-box behavior without distorting aspect ratio.
- In `feature-grid`, while editing, the text must stay next to the icon.
- `checklist` always has exactly 3 items.

## Preview and timeline

- [`components/StudioPreview.tsx`](/d:/VideoCreatorApp/components/StudioPreview.tsx) - main preview window and top toolbar.
- [`components/SceneTimeline.tsx`](/d:/VideoCreatorApp/components/SceneTimeline.tsx) - scene timeline and drag-and-drop reorder.
- [`components/SceneInspector.tsx`](/d:/VideoCreatorApp/components/SceneInspector.tsx) - right-side editing panel.

## Undo / Redo

- Undo/redo is implemented in [`components/EditorWorkspace.tsx`](/d:/VideoCreatorApp/components/EditorWorkspace.tsx).
- Supported shortcuts:
  - `Ctrl+Z`
  - `Ctrl+Shift+Z`
  - `Ctrl+Y`
- There are also undo/redo buttons in the studio top bar.
- The history stores snapshots of the workspace state:
  - `projectName`
  - `sceneTrack`
  - `exportSettings`
  - `selectedSceneId`

## Autosave

- The project is saved automatically after changes.
- Autosave is delayed so it does not send a request on every keystroke.
- Manual save via the button still exists.
- After the first successful save, `projectId` is updated in the URL as `?project=...`.

### What triggers saving

- scene changes;
- project name changes;
- export setting changes;
- scene reorder;
- scene creation / deletion / duplication.

## Saving and loading

- [`lib/projectPersistence.ts`](/d:/VideoCreatorApp/lib/projectPersistence.ts) - Supabase CRUD.
- The following are persisted:
  - `sceneTrack`
  - `exportSettings`
  - `projectName`
  - `projectId`
- Loading goes through `loadProject(...)`.
- Project deletion is soft delete: `deleted = true`.

## Upload media

- [`lib/imageUpload.ts`](/d:/VideoCreatorApp/lib/imageUpload.ts) - saving uploaded images.
- Used for:
  - logo;
  - website screenshot;
  - author photo / logo.
- Files are stored in the `project-images` bucket.

## Export video

- [`lib/ffmpeg.ts`](/d:/VideoCreatorApp/lib/ffmpeg.ts) - browser-based `.mp4` export.
- Uses:
  - `html-to-image` for frame capture;
  - `ffmpeg.wasm` for video assembly;
  - an offscreen React root to render frames.
- Export runs frame-by-frame across scenes and transition frames.

### Important

- Export renders separate `renderLayer`s:
  - `background`
  - `content`
  - `full`
- This is needed for clean transition frames.

## Generate by URL

- [`lib/siteGenerator.ts`](/d:/VideoCreatorApp/lib/siteGenerator.ts) - website-based project generation.
- [`app/api/generate-from-url/route.ts`](/d:/VideoCreatorApp/app/api/generate-from-url/route.ts) - API endpoint.
- Flow:
  - the server fetches the HTML;
  - extracts title, description, headings, bullets, CTA, and `og:image`;
  - builds a template-based scene draft.

### Limitations

- Generation is deterministic, not LLM-based.
- Quality depends on the website structure.
- Regex-based parsing can be noisy on complex sites.

## Animated icons

- [`lib/animatedFeatureIcons.ts`](/d:/VideoCreatorApp/lib/animatedFeatureIcons.ts) - current feature icon set.
- [`components/AnimatedIconPlayer.tsx`](/d:/VideoCreatorApp/components/AnimatedIconPlayer.tsx) - Lottie player.
- [`components/EmojiAssetPicker.tsx`](/d:/VideoCreatorApp/components/EmojiAssetPicker.tsx) - feature icon picker.

### Current behavior

- Feature icons come from AnimatedIcons.
- They are animated in export and preview.
- The editor lets the user choose an icon from the picker.

## Current product rules

- `feature-grid` uses animated icons by default.
- `checklist` always contains 3 items.
- Logos and images must support arbitrary aspect ratios correctly.
- CTA appears earlier, the click/accent happens closer to the end of the scene, and then fade follows.
- The studio header is compact, with undo/redo and autosave.

## Where it is safe to make changes

- New or changed scene types - [`lib/sceneDefinitions.ts`](/d:/VideoCreatorApp/lib/sceneDefinitions.ts).
- Autosave logic, undo/redo, top bar - [`components/EditorWorkspace.tsx`](/d:/VideoCreatorApp/components/EditorWorkspace.tsx).
- Scene card UI and preview - [`components/SceneStage.tsx`](/d:/VideoCreatorApp/components/SceneStage.tsx).
- Project save/load - [`lib/projectPersistence.ts`](/d:/VideoCreatorApp/lib/projectPersistence.ts).
- URL generation - [`lib/siteGenerator.ts`](/d:/VideoCreatorApp/lib/siteGenerator.ts).
- Video export - [`lib/ffmpeg.ts`](/d:/VideoCreatorApp/lib/ffmpeg.ts).

## Known risks

- `SceneStage.tsx` is very large and contains a lot of UI logic.  
  Large changes there can easily break one of the scenes.
- Video export is sensitive to any DOM or animation changes.
- Autosave and undo/redo depend on stable state snapshots.
- URL generation may break on unusual websites.

## What the next agent should remember

1. Do not break the stability of `scene.id`.
2. Do not make React keys depend on mutable text.
3. If you change a scene, check:
   - editor;
   - preview;
   - export;
   - autosave.
4. For any new images, keep fit-to-box behavior in mind, not fixed square sizing.
5. After UI changes, always run `npm run build`.
