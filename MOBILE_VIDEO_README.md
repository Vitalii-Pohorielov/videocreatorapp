# Mobile Video Branch README

This document explains the current `CreateMobileVideo` branch and the new `/mobile-video` workflow.

Use it as the first reference before changing the mobile editor, export pipeline, or Remotion integration.

## Goal

This branch creates a safe experiment area for mobile video work without breaking the main editor.

Current product split:

- `/editor` keeps the original browser export flow based on `ffmpeg.wasm`
- `/mobile-video` reuses the current editor UI, but exports through a server-side Remotion pipeline

High-level target:

`React editor -> JSON payload -> Remotion -> mp4 on server`

## Current Status

What is already done:

- a separate `/mobile-video` route exists
- the mobile route uses the same `EditorWorkspace` UI as the main editor
- mobile export is switched to `exportMode="remotion-server"`
- editor state is serialized as JSON and posted to `/api/mobile-video/render`
- the server route writes the payload to a temp file and launches a separate Node render process
- the render process bundles a Remotion composition and renders an `.mp4`
- builds pass with `npm run build`
- direct script-based test renders produce a real `.mp4`
- the current mobile export flow is working again after reverting the experimental polling-based progress system

What is intentionally still shared with the main editor:

- scene schema
- Zustand project state
- `SceneStage` scene rendering logic
- save/load project persistence

What is still not isolated yet:

- mobile projects are not stored in a separate table or project type
- opening saved video drafts still follows the general project persistence model

## Important Rule

Treat `/mobile-video` as the experimental area.

Do not change the main `/editor` export pipeline unless that is explicitly intended.

When possible:

- make changes behind the mobile route only
- prefer adding mobile-specific helpers over rewriting the main export path

## Main Flow

### 1. Mobile editor entry

Route:

- [app/mobile-video/page.tsx](/d:/VideoCreatorApp/app/mobile-video/page.tsx)

What it does:

- protects the page with `AuthGate`
- opens `EditorWorkspace`
- sets `workspaceBasePath="/mobile-video"`
- sets `exportMode="remotion-server"`

### 2. Shared editor UI

Main file:

- [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx)

What changed for mobile:

- `EditorWorkspace` now accepts `workspaceBasePath`
- `EditorWorkspace` now accepts `exportMode`
- save/load URL history updates use the configurable base path
- export switches between:
  - browser export via `exportSlidesToVideo(...)`
  - mobile server export via `exportMobileVideo(...)`

The editor UI is still the same component for both flows.

## Mobile Export Pipeline

### 1. Client payload creation

File:

- [lib/mobileVideoExport.ts](/d:/VideoCreatorApp/lib/mobileVideoExport.ts)

Responsibilities:

- create a `MobileVideoRenderPayload`
- POST it to `/api/mobile-video/render`
- receive the returned `.mp4`
- create a browser download URL

Current behavior:

- this is a single blocking request
- the UI does not receive detailed render-time progress stages from the server right now
- the simple export percent shown in the UI is only a lightweight placeholder for the mobile path

Payload shape:

- `projectName`
- `scenes`
- `exportSettings`

### 2. Shared mobile timeline helpers

File:

- [lib/mobileVideoRender.ts](/d:/VideoCreatorApp/lib/mobileVideoRender.ts)

Responsibilities:

- define `MobileVideoRenderPayload`
- compute dimensions from export settings
- compute total duration
- compute duration in frames
- compute playback state for a given time
- compute transition layer transforms for Remotion
- generate a safe download filename

This file is the shared logic between editor-time assumptions and Remotion render-time assumptions.

### 3. Server route

File:

- [app/api/mobile-video/render/route.ts](/d:/VideoCreatorApp/app/api/mobile-video/render/route.ts)

Responsibilities:

- validate payload shape
- write payload JSON to a temp folder
- launch a separate Node process for rendering
- read the output `.mp4`
- return it as a download response
- clean up temp files

Current behavior:

- the route waits for the render subprocess to finish before responding
- there is no job queue or polling API in the current version

Why the route uses a subprocess:

- importing `@remotion/renderer` directly inside the Next app route caused build issues with Turbopack and platform-specific binaries
- the subprocess keeps the route lightweight and avoids bundling Remotion internals into the app route

### 4. Render subprocess

File:

- [scripts/render-mobile-video.cjs](/d:/VideoCreatorApp/scripts/render-mobile-video.cjs)

Responsibilities:

- build a dedicated CSS file for Remotion using Tailwind CLI
- create or reuse a cached Remotion bundle
- patch webpack alias resolution for `@/`
- load the JSON payload
- select the `MobileVideo` composition
- render the output video to the requested file path

This script is the real rendering entrypoint for mobile export.

Important:

- the temporary experimental `% progress` system was removed
- if you want to add detailed progress later, do it carefully in a separate branch or checkpoint because it previously made the flow less stable

## Remotion Layer

### Composition root

File:

- [remotion/root.tsx](/d:/VideoCreatorApp/remotion/root.tsx)

Responsibilities:

- import the generated CSS file
- register the `MobileVideo` composition
- derive width, height, fps, and duration from the payload via `calculateMetadata`

### Composition renderer

File:

- [remotion/MobileVideoComposition.tsx](/d:/VideoCreatorApp/remotion/MobileVideoComposition.tsx)

Responsibilities:

- convert current frame to current time in seconds
- compute current scene and transition state
- render the current scene using `SceneStage`
- render transition layers when needed

Important note:

- this composition currently reuses [components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx) instead of creating a fully separate Remotion-native scene system
- this is the fastest migration path, but it means the Remotion render still depends on assumptions originally built for the browser editor

## CSS and Styling Notes

Files involved:

- [app/globals.css](/d:/VideoCreatorApp/app/globals.css)
- [tailwind.config.ts](/d:/VideoCreatorApp/tailwind.config.ts)
- [remotion/generated.css](/d:/VideoCreatorApp/remotion/generated.css)
- [scripts/render-mobile-video.cjs](/d:/VideoCreatorApp/scripts/render-mobile-video.cjs)

What changed:

- `tailwind.config.ts` now includes `./remotion/**/*`
- Remotion no longer imports raw `app/globals.css`
- before rendering, the script runs Tailwind CLI and outputs `remotion/generated.css`
- the Remotion root imports that generated CSS

Why:

- importing raw Tailwind directives into the Remotion bundle was not enough
- the bundle needed a precompiled CSS file with real utility classes

## Current Stability Notes

The current state is:

- `/mobile-video` exports again
- the direct Remotion server render path is the active implementation
- the earlier experimental job/polling progress flow was reverted

Known caution areas:

- the mobile export path still depends heavily on `SceneStage`
- the mobile flow is not yet isolated at the persistence layer
- browser/process behavior on Windows should be watched when changing Remotion browser settings

## Best Next Steps

Recommended order:

1. Fix style parity for exported mobile scenes by auditing `SceneStage`
2. Decide whether to keep reusing `SceneStage` or introduce a dedicated Remotion-only scene renderer
3. Move mobile video to its own project type or persistence bucket
4. Add true mobile-first output formats like `9:16`
5. If needed, reintroduce render progress reporting carefully and behind a stable checkpoint

## Files You Will Touch Most

- [components/EditorWorkspace.tsx](/d:/VideoCreatorApp/components/EditorWorkspace.tsx)
- [lib/mobileVideoExport.ts](/d:/VideoCreatorApp/lib/mobileVideoExport.ts)
- [lib/mobileVideoRender.ts](/d:/VideoCreatorApp/lib/mobileVideoRender.ts)
- [app/api/mobile-video/render/route.ts](/d:/VideoCreatorApp/app/api/mobile-video/render/route.ts)
- [scripts/render-mobile-video.cjs](/d:/VideoCreatorApp/scripts/render-mobile-video.cjs)
- [remotion/root.tsx](/d:/VideoCreatorApp/remotion/root.tsx)
- [remotion/MobileVideoComposition.tsx](/d:/VideoCreatorApp/remotion/MobileVideoComposition.tsx)
- [components/SceneStage.tsx](/d:/VideoCreatorApp/components/SceneStage.tsx)

## How To Test

Main checks:

- run `npm run build`
- open `/mobile-video`
- create or edit a draft
- export the video
- compare the exported `.mp4` against the editor preview

Direct renderer check:

- run `node .\\scripts\\render-mobile-video.cjs <payload.json> <output.mp4>`

This is useful when you want to debug the Remotion render without going through the full app flow.

## Branch Context

Working branch:

- `CreateMobileVideo`

Important baseline commit:

- `1832098` - `Add mobile video editor lab workflow`

That commit is the safe return point before the Remotion export work continued.

## Final Guidance

If you are a human or an AI agent picking this up:

- assume `/mobile-video` is the sandbox
- keep the main `/editor` stable
- treat the current export flow as working
- prefer incremental changes with checkpoints because export regressions are easy to introduce here
