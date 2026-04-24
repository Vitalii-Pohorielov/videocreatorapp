import { execFileSync } from "node:child_process";
import path from "node:path";

export type MobileVideoRenderEvent =
  | { type: "phase"; phase: string; progress: number; subtitle?: string }
  | { type: "done"; url: string; fileName: string; size: number }
  | { type: "error"; message: string };

export function formatSseEvent(message: MobileVideoRenderEvent) {
  return `data: ${JSON.stringify(message)}\n\n`;
}

export function ensureLocalRemotionBundle() {
  execFileSync(process.execPath, [path.join(process.cwd(), "scripts", "bundle-remotion-vercel.cjs")], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
