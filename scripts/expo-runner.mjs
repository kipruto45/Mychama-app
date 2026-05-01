import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);
const expoBin = join(projectRoot, "node_modules", "expo", "bin", "cli");
const userArgs = process.argv.slice(2);
const supportedMajors = new Set([20, 22, 24]);
const preferredMajors = [24, 22, 20];

if (!existsSync(expoBin)) {
  console.error("Expo CLI is not installed. Run `npm install` in Mychama-app first.");
  process.exit(1);
}

const currentMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
const resolvedNode = resolveNodeBinary(currentMajor);

if (!resolvedNode) {
  console.error(
    `Unsupported Node runtime ${process.version}. Use Node 20 or 22. ` +
      "This repo includes `.nvmrc`, so `nvm use` is the expected fix.",
  );
  process.exit(1);
}

if (resolvedNode.path !== process.execPath) {
  console.warn(`Switching from ${process.version} to ${resolvedNode.version} for Expo CLI.`);
}

const child = spawn(resolvedNode.path, [expoBin, ...userArgs], {
  cwd: projectRoot,
  env: buildChildEnv(),
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Failed to start Expo CLI: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function resolveNodeBinary(currentVersionMajor) {
  if (supportedMajors.has(currentVersionMajor)) {
    return { path: process.execPath, version: process.version };
  }

  const home = process.env.HOME;

  if (!home) {
    return null;
  }

  const nvmVersionsDir = join(home, ".nvm", "versions", "node");

  if (!existsSync(nvmVersionsDir)) {
    return null;
  }

  const entries = readdirSync(nvmVersionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      major: Number.parseInt(entry.name.slice(1).split(".")[0] ?? "", 10),
      path: join(nvmVersionsDir, entry.name, "bin", "node"),
    }))
    .filter((entry) => existsSync(entry.path))
    .sort((left, right) => compareNodeVersionsDesc(left.name, right.name));

  for (const preferredMajor of preferredMajors) {
    const match = entries.find((entry) => entry.major === preferredMajor);

    if (match) {
      return { path: match.path, version: match.name };
    }
  }

  return null;
}

function compareNodeVersionsDesc(left, right) {
  const leftParts = left.slice(1).split(".").map(Number);
  const rightParts = right.slice(1).split(".").map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const diff = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function buildChildEnv() {
  const env = { ...process.env };

  // Expo's startup validation fetch is currently failing in this environment
  // before Metro is ready. Skip the remote validation and use local packages.
  if (!env.EXPO_NO_DEPENDENCY_VALIDATION) {
    env.EXPO_NO_DEPENDENCY_VALIDATION = "1";
  }

  if (usesTunnelMode() && !env.EXPO_TUNNEL_SUBDOMAIN) {
    // Expo's default exp.direct hostname path is currently failing in this
    // environment. Force the legacy subdomain tunnel flow, which works.
    env.EXPO_TUNNEL_SUBDOMAIN = "true";
  }

  return env;
}

function usesTunnelMode() {
  return (
    userArgs.includes("--tunnel") ||
    (userArgs.includes("--host") && userArgs.includes("tunnel"))
  );
}
