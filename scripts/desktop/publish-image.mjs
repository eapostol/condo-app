import { readDesktopEnv, runCommand } from "./common.mjs";

const env = readDesktopEnv();
const image = env.CONDO_APP_IMAGE;
const dbImage = env.CONDO_DB_IMAGE;

if (!image) {
  throw new Error("CONDO_APP_IMAGE is not set in desktop.env.");
}

if (!dbImage) {
  throw new Error("CONDO_DB_IMAGE is not set in desktop.env.");
}

await runCommand("docker", [
  "buildx",
  "build",
  "--platform",
  "linux/amd64,linux/arm64",
  "-t",
  image,
  "--push",
  "."
]);

await runCommand("docker", [
  "buildx",
  "build",
  "--platform",
  "linux/amd64,linux/arm64",
  "-f",
  "docker/mysql/Dockerfile",
  "-t",
  dbImage,
  "--push",
  "."
]);
