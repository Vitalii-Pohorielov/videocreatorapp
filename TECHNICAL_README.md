# Technical README

This file is the fastest onboarding path for the next developer or AI agent.
Use it as the project map before changing editor flow, scene rendering, export, or persistence.

The app already includes:

- a browser scene editor;
- project save/load via Supabase;
- browser-side `.mp4` export;
- deterministic draft generation from a website URL;
- a second creation mode for announcement videos.

## Stable baseline

Treat the current `main` branch HEAD as the recovery baseline when future work breaks the app.

- If a new change causes regressions, compare against this baseline first.
- Do not rewrite history for this point unless explicitly requested.
- Before large refactors, create a new branch and keep this baseline easy to restore.
- Prefer additive changes and verify build stability before replacing core editor/export logic.

### Baseline policy for the next agent or developer

1. Start by checking what changed after this baseline.
2. If the editor, autosave, export, or URL generation breaks, use this baseline as the last trusted reference.
3. When unsure whether a regression is old or new, diff from this baseline first.
4. Keep `TECHNICAL_README.md` updated when a new trusted baseline is intentionally promoted.

## What this project is

This is a Next.js 16 app for assembling short promo or announcement videos from scene blocks.

The user can:

- create or open a project;
- edit scenes in preview or inspector;
- upload logos, screenshots, author media, and announcement project tiles;
- generate a draft from a website URL;
- build announcement slogan sequences from pasted text;
- export the final result to `.mp4`;
- save the project to Supabase.

## Key commands

- `npm run dev` - local development.
- `npm run build` - production build.
- `npm run start` - run the production build.
- `npm run lint` - linting.

## Main architecture

### App Router

- [app/page.tsx](/d:/VideoCreatorApp/app/page.tsx) - landing page.
- [app/editor/page.tsx](/d:/VideoCreatorApp/app/editor/page.tsx) - editor studio.
- [app/projects/page.tsx](/d:/VideoCreatorApp/app/projects/page.tsx) - project list.
- [app/api/generate-from-url/route.ts](/d:/VideoCreatorApp/app/api/generate-from-url/route.ts) - server route for website-to-draft generation.

### Main orchestration layer

- [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx) is the central editor container.
- This is where the following meet:
  - project hydration/reset;
  - autosave and manual save;
  - undo/redo snapshots;
  - playback timing;
  - URL generation;
  - announcement `Express Create`;
  - export;
  - wiring between preview, timeline, and inspector.

### Core UI surfaces

- [components/StudioPreview.tsx](/d:/VideoCreatorApp/components/StudioPreview.tsx) - top toolbar, playback preview, export controls, URL generation, Express Create modal.
- [components/SceneTimeline.tsx](/d:/VideoCreatorApp/components/SceneTimeline.tsx) - single-track sortable scene list.
- [components/SceneInspector.tsx](/d:/VideoCreatorApp/components/SceneInspector.tsx) - right-side scene and export settings editor.
- [components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx) - scene renderer for edit, preview, and export.
- [components/SceneTypeModal.tsx](/d:/VideoCreatorApp/components/SceneTypeModal.tsx) - filtered scene catalog based on workspace mode.
- [components/ProjectTypeModal.tsx](/d:/VideoCreatorApp/components/ProjectTypeModal.tsx) - project type chooser.

## Creation modes

Video mode lives in [lib/sceneDefinitions.ts](/d:/VideoCreatorApp/lib/sceneDefinitions.ts) as `VideoType = "promo" | "announcement"`.

- `promo` starts with `brand-reveal`, `product-showcase`, `feature-grid`, `center-text`, `cta`.
- `announcement` currently starts with `announcement-hero`.
- The source of truth is `createInitialSceneTrackForVideoType(...)`.

Important:

- Some UI copy still says the announcement editor starts blank.
- Actual store reset behavior currently seeds one `announcement-hero` scene.
- If this changes, update both the modal copy and this README together.

### Isolation rule between promo and announcement

Treat `promo` and `announcement` as two separate editing branches inside one app.

- If you change announcement video behavior, keep the change scoped to announcement flow only.
- If you change promo video behavior, keep the change scoped to promo flow only.
- Do not assume a scene/layout/control added for one mode should automatically appear in the other mode.
- Do not unify scene catalogs, editor controls, transitions, or startup flows unless that is an explicit product decision.

In practice this means:

- `announcement` has its own scene set and its own editor flow.
- `promo` has its own scene set and its own editor flow.
- mode-specific changes should be guarded in scene definitions, modal filtering, editor workspace logic, inspector controls, preview behavior, and export behavior where needed.
- before shipping a change, verify whether it affects only the intended mode or both modes.

## Data model

### Scene

A scene is described by the [`Scene`](/d:/VideoCreatorApp/lib/sceneDefinitions.ts) type.

Key fields:

- `id`
- `type`
- `name`
- `durationSeconds`
- `transition`
- `eyebrow`
- `title`
- `subtitle`
- `description`
- `bullets`
- `projectCount`
- `projectImageUrls`
- `pricingPlanTitles`
- `pricingPlanDescriptions`
- `processStepDescriptions`
- `bulletEmojis`
- `bulletImageUrls`
- `websiteImageUrl`
- `logoImageUrl`
- `authorImageUrl`
- `mediaPosition`
- `code`

### Export settings

`ExportSettings` currently includes:

- `fps`
- `transitionSeconds`
- `backgroundColor`
- `textColor`
- `preset`
- `resolution`
- `profile`

### Scene track

There is one track today:

- `SceneTrack.id` is always `"main-track"`.
- The editor assumes a single linear scene list.

## Scene catalog

Definitions and templates live in [lib/sceneDefinitions.ts](/d:/VideoCreatorApp/lib/sceneDefinitions.ts).

Current scene types:

- `announcement-hero`
- `brand-reveal`
- `product-showcase`
- `feature-grid`
- `code-preview`
- `slogan`
- `split-slogan`
- `description`
- `pricing`
- `process`
- `center-text`
- `website-url`
- `website-scroll`
- `quote`
- `cta`

Important catalog behavior:

- `slogan` still exists in definitions, but [components/SceneTypeModal.tsx](/d:/VideoCreatorApp/components/SceneTypeModal.tsx) hides it from the add-scene modal.
- Announcement workspaces only expose `announcement-hero` and `split-slogan`.
- Promo workspaces hide `announcement-hero` and `split-slogan`.

Mode isolation reminder:

- Announcement-only scenes must stay announcement-only unless product requirements change.
- Promo scene changes should not silently alter announcement scenes.
- When adding a new scene type, decide explicitly whether it belongs to `promo`, `announcement`, or both.

### Scene-by-scene notes

- `announcement-hero` is the announcement opener with a configurable wall of uploaded project images.
- `brand-reveal` supports logo upload and optional animated code flavor through `code`.
- `product-showcase` supports uploaded screenshot placement on `left`, `right`, or `bottom`.
- `feature-grid` supports 1-6 bullets and auto-seeds animated icon assets.
- `code-preview` renders a stylized code card and stores code in both `code` and `description`.
- `split-slogan` is the second core announcement scene type and is used by Express Create.
- `description` is effectively a 3-line oversized text layout.
- `pricing` is fixed to 3 plans.
- `process` is fixed to 3 steps.
- `center-text` is a centered message scene used both directly and as a migration target for older saved scene types.
- `website-scroll` works best with a tall manually uploaded screenshot.
- `quote` supports author photo or logo upload.

## Store and normalization rules

[store/useStore.ts](/d:/VideoCreatorApp/store/useStore.ts) is the Zustand source of truth for editor state.

The store holds:

- `projectId`
- `projectName`
- `sceneTrack`
- `selectedSceneId`
- `exportSettings`

The store also owns:

- scene CRUD;
- duplication and reorder;
- export settings updates;
- project reset/hydration;
- scene normalization for old saved data.

### Current hard limits

- scene duration is clamped to `1.5 .. 8` seconds.
- `feature-grid` bullets are limited to `6`.
- total scenes are limited to `15`.
- `announcement-hero` project tiles are limited to `1 .. 25`.

### Important normalization behavior on loaded projects

When older projects are loaded, `normalizeLoadedScene(...)` upgrades some legacy scene types:

- `checklist` -> `process`
- `faq` -> `center-text`
- `testimonial-wall` -> `center-text`
- `metrics` -> `feature-grid`

Other important normalization:

- missing `transition` falls back via `getDefaultTransition(...)`;
- `brand-reveal` and `center-text` titles are normalized to sentence case;
- `pricing` is normalized back to 3 plan titles and 3 plan descriptions;
- `process` is normalized back to 3 step descriptions;
- `announcement-hero` clamps `projectCount` and resizes `projectImageUrls`;
- suspicious image placeholders like `"."`, `"/"`, or bare site roots are cleared.

### Scene update behavior

When `updateScene(...)` runs:

- durations are clamped;
- feature bullets/emojis/image arrays are resized together;
- empty `feature-grid` icons can be auto-filled from default animated icons;
- announcement project image slots are resized to match `projectCount`;
- uploaded image URLs are sanitized before persistence.

## Playback and transitions

Transition helpers live in [lib/sceneTransitions.ts](/d:/VideoCreatorApp/lib/sceneTransitions.ts).

Supported transitions:

- `fade`
- `slide-left`
- `slide-right`
- `slide-up`
- `slide-down`
- `zoom-in`
- `zoom-out`

Important rules:

- Announcement scene types are currently `announcement-hero` and `split-slogan`.
- `getDefaultTransition(index, sceneType)` returns animated transitions only for announcement scene types.
- Non-announcement scenes default to `fade`.
- The inspector exposes the transition selector only for announcement scenes.

Important implementation detail:

- Playback/export enables transition timing for the whole track if any announcement scene exists in the project.
- This means mixed promo + announcement timelines use transition gaps between scenes globally, even though only announcement scenes expose transition editing in the UI.
- If you change this behavior, audit [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx), [components/StudioPreview.tsx](/d:/VideoCreatorApp/components/StudioPreview.tsx), and [lib/ffmpeg.ts](/d:/VideoCreatorApp/lib/ffmpeg.ts) together.

## Editor behavior

### Undo / Redo

Undo/redo is implemented in [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx).

- Shortcuts: `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y`.
- History stores full workspace snapshots:
  - `projectName`
  - `sceneTrack`
  - `exportSettings`
  - `selectedSceneId`

### Autosave

- Autosave runs from a debounced effect in `EditorWorkspace`.
- Delay is currently `700ms`.
- A save signature is used to skip redundant autosaves.
- Manual save still exists and updates the toolbar status.
- After first successful save, the editor URL becomes `?project=...`.

### Express Create

Announcement mode has a fast generator in [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx).

- Input format is one line per scene: `Project Name**Slogan`.
- The parser is `parseExpressCreatePrompt(...)`.
- It preserves an existing `announcement-hero` if one already exists.
- It then generates one `split-slogan` scene per valid line.
- The resulting scene track becomes `[announcement-hero, ...split-slogan-scenes]`.

Important:

- `Express Create` is part of the announcement workflow, not the promo workflow.
- Changes to this flow should not change promo project creation or promo scene generation.

### Preview editing

`SceneStage` supports clickable editing affordances in preview mode.

- Logo upload can be triggered from preview.
- Product screenshot upload can be triggered from preview.
- Quote author image upload can be triggered from preview.
- `feature-grid` marker/icon changes happen through preview interactions.

## Scene rendering

[components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx) is the main renderer.

It supports:

- `editable` preview mode;
- playback/export mode;
- `renderLayer = "background" | "content" | "full"`;
- `performanceMode = "light"` for preview/export stability.

Important rendering notes:

- Announcement scenes have different outro timing than promo scenes.
- Export and transition rendering depend on layered rendering being stable.
- Image/logo rendering tries to preserve aspect ratio instead of forcing square crops.
- `website-scroll` depends on the uploaded screenshot dimensions for visible motion.

## Saving and loading

[lib/projectPersistence.ts](/d:/VideoCreatorApp/lib/projectPersistence.ts) handles Supabase CRUD.

Persisted project data:

- `sceneTrack`
- `exportSettings`
- `projectName`
- `projectId`

Other notes:

- loading flows through `loadProject(...)`;
- deletion is soft delete via `deleted = true`.

## Media upload

[lib/imageUpload.ts](/d:/VideoCreatorApp/lib/imageUpload.ts) handles browser-side file processing/storage URL creation.

Current upload targets:

- project logo;
- product/website screenshot;
- quote author media;
- announcement project wall images.

Files are stored in the `project-images` bucket.

## Export pipeline

[lib/ffmpeg.ts](/d:/VideoCreatorApp/lib/ffmpeg.ts) performs browser-side export.

Main pieces:

- `html-to-image` captures scene DOM to canvas;
- `ffmpeg.wasm` assembles frames into `.mp4`;
- an offscreen React root renders export frames;
- export progress is split between frame render work and ffmpeg encode work.

### Export profiles

Profiles are defined in `getExportProfileConfig(...)`:

- `draft` -> `15fps`, lower JPEG quality, faster encode.
- `standard` -> `20fps`, medium quality.
- `high` -> `24fps`, higher JPEG quality, slower encode.

### Export resolutions

Defined in `exportResolutionDimensions`:

- `480p` -> `854x480`
- `540p` -> `960x540`
- `720p` -> `1280x720`

### Export-specific implementation details

- Transition frames are generated only when the project contains announcement scenes.
- Transition capture must stay sequential because all export rendering shares one offscreen React root.
- Export waits for fonts, images, and Lottie readiness before capture.
- Background/content layers are rendered separately for clean transition compositing.
- Output file names are sanitized from the current project name.

## Generate by URL

Website generation lives in:

- [lib/siteGenerator.ts](/d:/VideoCreatorApp/lib/siteGenerator.ts)
- [app/api/generate-from-url/route.ts](/d:/VideoCreatorApp/app/api/generate-from-url/route.ts)

Flow:

1. The server fetches the website HTML with a browser-like user agent.
2. It extracts title, description, headings, paragraphs, bullets, CTA text, and `og:image`.
3. It builds a short deterministic scene draft.
4. It assigns a random preset from current preset defaults.

Current draft shape:

- `brand-reveal`
- `description`
- either `product-showcase` or `feature-grid`
- either `cta` or `website-url`

Important limitations:

- generation is deterministic, not LLM-based;
- parsing is regex/string-based and can be noisy;
- output quality depends heavily on site structure and metadata quality.

## Presets and styling

Preset definitions live in [lib/sceneDefinitions.ts](/d:/VideoCreatorApp/lib/sceneDefinitions.ts), and preset chips/styles live in [components/SceneInspector.tsx](/d:/VideoCreatorApp/components/SceneInspector.tsx).

Current presets:

- `white`
- `black`
- `premium`
- `bold`
- `editorial`
- `sunset`
- `mono`
- `neon-grid`
- `paper-cut`
- `arctic-glass`
- `brutalist`
- `velvet-noir`
- `mint-pop`
- `terminal`
- `blueprint`
- `acid-pop`
- `retro-print`
- `ember-glow`

Compatibility note:

- `normalizeTemplatePreset(...)` maps legacy `clean` -> `white`.

## Animated icons

- [lib/animatedFeatureIcons.ts](/d:/VideoCreatorApp/lib/animatedFeatureIcons.ts) - current feature icon definitions.
- [components/AnimatedIconPlayer.tsx](/d:/VideoCreatorApp/components/AnimatedIconPlayer.tsx) - Lottie player.
- [components/EmojiAssetPicker.tsx](/d:/VideoCreatorApp/components/EmojiAssetPicker.tsx) - icon picker UI.

Current behavior:

- `feature-grid` seeds animated icons by default;
- icons animate in preview and export;
- fallback emoji data is still kept next to image URLs.

## Where it is safe to make changes

- new or changed scene definitions - [lib/sceneDefinitions.ts](/d:/VideoCreatorApp/lib/sceneDefinitions.ts)
- transition behavior - [lib/sceneTransitions.ts](/d:/VideoCreatorApp/lib/sceneTransitions.ts)
- autosave, undo/redo, playback, editor orchestration - [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx)
- scene controls and export settings UI - [components/SceneInspector.tsx](/d:/VideoCreatorApp/components/SceneInspector.tsx)
- preview/toolbar/export UI - [components/StudioPreview.tsx](/d:/VideoCreatorApp/components/StudioPreview.tsx)
- scene rendering - [components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx)
- project save/load - [lib/projectPersistence.ts](/d:/VideoCreatorApp/lib/projectPersistence.ts)
- URL generation - [lib/siteGenerator.ts](/d:/VideoCreatorApp/lib/siteGenerator.ts)
- export - [lib/ffmpeg.ts](/d:/VideoCreatorApp/lib/ffmpeg.ts)

Before changing any of the files above, first decide:

- is this a `promo` change;
- is this an `announcement` change;
- or is this truly shared behavior that should affect both modes.

If the answer is not clearly "shared", keep the implementation scoped to one mode.

## Known risks

- [components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx) is large and easy to break with broad edits.
- Export is sensitive to DOM structure, asset readiness, and animation timing.
- Autosave and undo/redo depend on stable whole-workspace snapshots.
- Mixed promo/announcement timelines can have surprising transition timing behavior.
- UI copy about announcement startup mode can drift from actual store initialization.
- URL generation may produce weak drafts on unusual websites.

## What the next agent should remember

1. Do not break the stability of `scene.id`.
2. Do not make React keys depend on mutable text.
3. If you change scenes, check editor, preview, export, autosave, and load/hydrate behavior.
4. If you change transitions, verify playback timing and export timing together.
5. If you change scene migrations in the store, keep old saved projects loading cleanly.
6. If you change creation-mode behavior, update both UI copy and this README.
7. For image-based scenes, preserve aspect ratio handling.
8. After meaningful UI or export changes, run `npm run build`.
9. If you are editing announcement video logic, keep the change inside the announcement branch unless expanding promo is explicitly intended.
10. If you are editing promo video logic, keep the change inside the promo branch unless expanding announcement is explicitly intended.
