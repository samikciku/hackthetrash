// Cross-platform setup script — works on macOS, Linux and Windows.
// Usage:  node scripts/setup.mjs
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function install(name) {
  console.log(`\n→ Installing ${name} deps...`);
  const r = spawnSync(npm, ["install"], {
    cwd: path.join(root, name),
    stdio: "inherit",
    shell: false
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

install("backend");
install("frontend");
console.log("\nDone. Run `node scripts/dev.mjs` to start both services.");
