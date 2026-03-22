import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..", "..");
export const desktopEnvPath = path.join(projectRoot, "desktop.env");
export const launcherOutDir = path.join(projectRoot, "launcher", "out");
export const releaseDir = path.join(projectRoot, "releases");

export function readDesktopEnv() {
  const contents = fs.readFileSync(desktopEnvPath, "utf8");
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value;
  }

  return values;
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      stdio: options.stdio || "inherit",
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    if (options.stdio === "pipe") {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        Object.assign(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`), {
          code,
          stdout,
          stderr
        })
      );
    });
  });
}

export function findPackagedLauncher(platform) {
  if (!fs.existsSync(launcherOutDir)) {
    throw new Error("launcher/out was not found. Package the launcher before assembling a release bundle.");
  }

  const entries = fs
    .readdirSync(launcherOutDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name.includes(`-${platform}-`));

  if (entries.length === 0) {
    throw new Error(`No packaged launcher was found for ${platform} in launcher/out.`);
  }

  entries.sort();
  return path.join(launcherOutDir, entries[entries.length - 1]);
}

export function copyRecursive(sourcePath, targetPath, shouldSkip) {
  const relativePath = path.relative(projectRoot, sourcePath) || ".";

  if (shouldSkip(relativePath)) {
    return;
  }

  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    fs.mkdirSync(targetPath, { recursive: true });
    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(
        path.join(sourcePath, entry),
        path.join(targetPath, entry),
        shouldSkip
      );
    }
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

export async function zipDirectory(sourceDir, outputFile) {
  if (process.platform === "win32") {
    await runCommand("tar", ["-a", "-cf", outputFile, path.basename(sourceDir)], {
      cwd: path.dirname(sourceDir)
    });
    return;
  }

  if (process.platform === "darwin") {
    await runCommand("ditto", ["-c", "-k", "--keepParent", sourceDir, outputFile]);
    return;
  }

  await runCommand("zip", ["-r", outputFile, path.basename(sourceDir)], {
    cwd: path.dirname(sourceDir)
  });
}
