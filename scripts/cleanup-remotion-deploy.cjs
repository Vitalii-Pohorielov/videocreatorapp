const fs = require("node:fs/promises");
const path = require("node:path");

const targets = [
  path.join(process.cwd(), "node_modules", ".remotion"),
  path.join(process.cwd(), "node_modules", "@esbuild"),
  path.join(process.cwd(), "node_modules", "@rspack"),
  path.join(process.cwd(), "node_modules", "@remotion", "bundler"),
  path.join(process.cwd(), "node_modules", "@remotion", "studio"),
  path.join(process.cwd(), "node_modules", "@remotion", "studio-shared"),
  path.join(process.cwd(), "node_modules", "@remotion", "web-renderer"),
  path.join(process.cwd(), "node_modules", "@remotion", "compositor-win32-x64-msvc"),
  path.join(process.cwd(), "node_modules", "@img", "sharp-win32-x64"),
];

async function main() {
  for (const target of targets) {
    await fs.rm(target, { recursive: true, force: true }).catch(() => undefined);
  }

  console.log("[mobile-video cleanup] Removed build-only Remotion artifacts before Vercel packaging.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
