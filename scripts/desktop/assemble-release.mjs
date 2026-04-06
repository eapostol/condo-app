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
const bundleMode = process.argv[3] || "full";
const arch = process.argv[4] || "";

if (!platform) {
  throw new Error("Usage: node scripts/desktop/assemble-release.mjs <win32|darwin|linux> [full|runtime] [arch]");
}

if (!["full", "runtime"].includes(bundleMode)) {
  throw new Error("Bundle mode must be either 'full' or 'runtime'.");
}

const desktopEnv = readDesktopEnv();
const image = desktopEnv.CONDO_APP_IMAGE;
if (!image) {
  throw new Error("CONDO_APP_IMAGE is not set in desktop.env.");
}

const packagedLauncherPath = findPackagedLauncher(platform, arch);
const versionTag = image.split(":").pop();
const inferredArch = arch || inferArchitectureFromPackagedLauncherPath(packagedLauncherPath, platform);
const archSuffix = inferredArch ? `-${inferredArch}` : "";
const bundleName = `condo-management-portal-${versionTag}-${platform}${archSuffix}-${bundleMode}`;
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

function inferArchitectureFromPackagedLauncherPath(packagedPath, expectedPlatform) {
  const folderName = path.basename(packagedPath);
  const marker = `-${expectedPlatform}-`;
  const markerIndex = folderName.lastIndexOf(marker);

  if (markerIndex === -1) {
    return "";
  }

  return folderName.slice(markerIndex + marker.length);
}

const runtimeBundleFiles = [
  ".env.docker",
  "desktop.env",
  "docker-compose.desktop.yml",
  "README.md",
  "LICENSE.md",
  "START_here.txt"
];

cleanDir(stagingRoot);
ensureDir(releaseDir);

if (bundleMode === "full") {
  for (const entry of fs.readdirSync(projectRoot)) {
    copyRecursive(
      path.join(projectRoot, entry),
      path.join(bundleRoot, entry),
      shouldSkip
    );
  }
} else {
  for (const relativePath of runtimeBundleFiles) {
    const sourcePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Runtime bundle is missing required file: ${relativePath}`);
    }

    copyRecursive(
      sourcePath,
      path.join(bundleRoot, relativePath),
      () => false
    );
  }
}

for (const entry of fs.readdirSync(packagedLauncherPath)) {
  copyRecursive(
    path.join(packagedLauncherPath, entry),
    path.join(launcherDestination, entry),
    () => false
  );
}

await zipDirectory(bundleRoot, outputZip);
