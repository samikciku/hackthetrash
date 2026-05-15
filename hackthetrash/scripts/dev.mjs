// Cross-platform dev runner — works on macOS, Linux and Windows.
// Usage:  node scripts/dev.mjs
//
// Spawns `npm run dev` for both backend and frontend, prefixing each
// stdout line with [backend]/[frontend] so logs interleave readably.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const palette = {
  backend: "\x1b[36m",  // cyan
  frontend: "\x1b[35m", // magenta
  reset: "\x1b[0m"
};

function run(name, cwd) {
  const child = spawn(npm, ["run", "dev"], {
    cwd: path.join(root, cwd),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });
  const tag = `${palette[name]}[${name}]${palette.reset} `;
  const pipe = (stream, target) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        target.write(tag + buf.slice(0, i + 1));
        buf = buf.slice(i + 1);
      }
    });
    stream.on("end", () => { if (buf) target.write(tag + buf + "\n"); });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`${tag}exited with code ${code}`);
    process.exit(code ?? 1);
  });
  return child;
}

console.log("Starting backend on :4000 and frontend on :3000");
const backend = run("backend", "backend");
const frontend = run("frontend", "frontend");

const stop = () => {
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
