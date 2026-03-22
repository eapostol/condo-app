import fs from "node:fs";
import path from "node:path";
import {
  cleanDir,
  copyRecursive,
  ensureDir,
  findPackagedLauncher,
  projectRoot,
  readDesktopEnv,
  releaseDir,
  zipDirectory
} from "./common.mjs";

const platform = process.argv[2];

if (!platform) {
  throw new Error("Usage: node scripts/desktop/assemble-release.mjs <win32|darwin|linux>");
}

const image = readDesktopEnv().CONDO_APP_IMAGE;
if (!image) {
  throw new Error("CONDO_APP_IMAGE is not set in desktop.env.");
}

const packagedLauncherPath = findPackagedLauncher(platform);
const versionTag = image.split(":").pop();
const bundleName = `condo-management-portal-${versionTag}-${platform}`;
const stagingRoot = path.join(releaseDir, ".staging", bundleName);
const bundleRoot = path.join(stagingRoot, bundleName);
const launcherDestination = path.join(bundleRoot, "Desktop Launcher");
const outputZip = path.join(releaseDir, `${bundleName}.zip`);

const ignoredPrefixes = [
  ".git",
  "node_modules",
  "client/node_modules",
  "server/node_modules",
  "launcher/node_modules",
  "launcher/out",
  "releases",
  ".vscode"
];

function shouldSkip(relativePath) {
  const normalised = relativePath.replace(/\\/g, "/");
  return ignoredPrefixes.some(
    (prefix) => normalised === prefix || normalised.startsWith(`${prefix}/`)
  );
}

cleanDir(stagingRoot);
ensureDir(releaseDir);

for (const entry of fs.readdirSync(projectRoot)) {
  copyRecursive(
    path.join(projectRoot, entry),
    path.join(bundleRoot, entry),
    shouldSkip
  );
}

for (const entry of fs.readdirSync(packagedLauncherPath)) {
  copyRecursive(
    path.join(packagedLauncherPath, entry),
    path.join(launcherDestination, entry),
    () => false
  );
}

await zipDirectory(bundleRoot, outputZip);
