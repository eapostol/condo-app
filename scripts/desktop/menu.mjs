import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";

// All actions in this menu delegate to the existing npm scripts.
// Keeping the command strings here makes it easy to see exactly what
// the menu will run and easy to update later if the package scripts change.
const COMMANDS = {
  build: "npm run desktop:image:build",
  push: "npm run desktop:image:push",
  publishMultiArch: "npm run desktop:image:publish",
  bundle: {
    full: {
      win: "npm run desktop:bundle:win",
      macIntel: "npm run desktop:bundle:mac:x64",
      macAppleSilicon: "npm run desktop:bundle:mac:arm64",
      linux: "npm run desktop:bundle:linux"
    },
    runtime: {
      win: "npm run desktop:bundle:runtime:win",
      macIntel: "npm run desktop:bundle:runtime:mac:x64",
      macAppleSilicon: "npm run desktop:bundle:runtime:mac:arm64",
      linux: "npm run desktop:bundle:runtime:linux"
    }
  }
};

// Run a command in the user's shell and stream output directly to the terminal
// so the user sees exactly the same logs they would get by typing it manually.
function runShellCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      windowsHide: false
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command}`));
    });
  });
}

// Simple helper for consistent menu formatting.
function printMenu() {
  console.log("");
  console.log("Desktop Release Menu");
  console.log("--------------------");
  console.log("1. Create build");
  console.log("2. Push images");
  console.log("3. Publish images");
  console.log("4. Bundle launcher");
  console.log("5. Exit");
  console.log("");
}

// For this project, "publish" can mean two different release intents:
// 1. a normal push of images that were already built locally
// 2. a multi-architecture buildx publish for broader distribution
// This submenu makes that distinction explicit.
async function promptPublishMode(rl) {
  console.log("");
  console.log("Publish options");
  console.log("---------------");
  console.log("1. Standard push (runs `npm run desktop:image:push`)");
  console.log("2. Multi-architecture publish (runs `npm run desktop:image:publish`)");
  console.log("");

  const answer = (await rl.question("Choose publish mode [1-2]: ")).trim();

  if (answer === "1") {
    return COMMANDS.push;
  }

  if (answer === "2") {
    return COMMANDS.publishMultiArch;
  }

  console.log("Invalid publish selection.");
  return null;
}

// Release bundles can be created in two modes:
// - full: keeps the broader repo/debug content
// - runtime: contains only the runtime-oriented distribution files
async function promptBundleMode(rl) {
  console.log("");
  console.log("Bundle modes");
  console.log("------------");
  console.log("1. Full bundle");
  console.log("2. Runtime-only bundle");
  console.log("");

  const answer = (await rl.question("Choose bundle mode [1-2]: ")).trim();

  if (answer === "1") {
    return "full";
  }

  if (answer === "2") {
    return "runtime";
  }

  console.log("Invalid bundle mode selection.");
  return null;
}

// Bundle creation needs both a mode and a target platform because each
// launcher package is platform-specific and the zip contents differ by mode.
async function promptBundlePlatform(rl, bundleMode) {
  console.log("");
  console.log("Bundle platforms");
  console.log("----------------");
  console.log("1. Windows");
  console.log("2. macOS");
  console.log("3. Linux");
  console.log("");

  const answer = (await rl.question("Choose bundle platform [1-3]: ")).trim();

  if (answer === "1") {
    return COMMANDS.bundle[bundleMode].win;
  }

  if (answer === "2") {
    return await promptMacBundleArchitecture(rl, bundleMode);
  }

  if (answer === "3") {
    return COMMANDS.bundle[bundleMode].linux;
  }

  console.log("Invalid bundle selection.");
  return null;
}

// macOS releases need an architecture choice because Intel and Apple Silicon
// output are different launcher packages and should produce different zip files.
async function promptMacBundleArchitecture(rl, bundleMode) {
  console.log("");
  console.log("macOS bundle architectures");
  console.log("--------------------------");
  console.log("Warning: package and test macOS bundles on local macOS storage only.");
  console.log("Avoid Windows-built zips, network shares, and mounted shared volumes.");
  console.log("");
  console.log("1. Apple Intel (x64)");
  console.log("2. Apple Silicon (arm64)");
  console.log("3. Build both");
  console.log("");

  const answer = (await rl.question("Choose macOS architecture [1-3]: ")).trim();

  if (answer === "1") {
    return COMMANDS.bundle[bundleMode].macIntel;
  }

  if (answer === "2") {
    return COMMANDS.bundle[bundleMode].macAppleSilicon;
  }

  if (answer === "3") {
    return [
      COMMANDS.bundle[bundleMode].macIntel,
      COMMANDS.bundle[bundleMode].macAppleSilicon
    ];
  }

  console.log("Invalid macOS architecture selection.");
  return null;
}

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    let shouldContinue = true;

    while (shouldContinue) {
      printMenu();
      const selection = (await rl.question("Choose an action [1-5]: ")).trim();
      let command = null;

      if (selection === "1") {
        command = COMMANDS.build;
      } else if (selection === "2") {
        command = COMMANDS.push;
      } else if (selection === "3") {
        command = await promptPublishMode(rl);
      } else if (selection === "4") {
        const bundleMode = await promptBundleMode(rl);
        if (!bundleMode) {
          continue;
        }

        command = await promptBundlePlatform(rl, bundleMode);
      } else if (selection === "5") {
        shouldContinue = false;
        continue;
      } else {
        console.log("Invalid menu selection.");
        continue;
      }

      if (!command) {
        continue;
      }

      try {
        const commands = Array.isArray(command) ? command : [command];

        for (const entry of commands) {
          console.log("");
          console.log(`Running: ${entry}`);
          console.log("");
          await runShellCommand(entry);
        }

        console.log("");
        console.log("Action completed successfully.");
      } catch (error) {
        console.error("");
        console.error(error.message);
      }
    }
  } finally {
    rl.close();
  }
}

await main();
