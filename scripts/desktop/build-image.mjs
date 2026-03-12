import { readDesktopEnv, runCommand } from "./common.mjs";

const image = readDesktopEnv().CONDO_APP_IMAGE;

if (!image) {
  throw new Error("CONDO_APP_IMAGE is not set in desktop.env.");
}

await runCommand("docker", ["build", "-t", image, "."]);
