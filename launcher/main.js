const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const APP_URL = "http://localhost:3000";
const HEALTH_URL = `${APP_URL}/api/health`;
const STARTUP_TIMEOUT_MS = 120000;
const HEALTH_POLL_INTERVAL_MS = 2000;

let mainWindow = null;
let isClosing = false;
let currentAction = Promise.resolve();
let projectPaths = null;
let launcherState = {
  status: "Stopped",
  message: "Checking launcher environment...",
  lastError: ""
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 440,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: "#f4efe6",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  mainWindow.on("close", (event) => {
    if (isClosing) {
      return;
    }

    event.preventDefault();
    void requestAppClose();
  });
}

function updateState(patch) {
  launcherState = { ...launcherState, ...patch };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("launcher:state-changed", launcherState);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCandidateStartDirs() {
  return [
    path.resolve(__dirname, ".."),
    __dirname,
    process.cwd(),
    path.dirname(process.execPath),
    process.resourcesPath || ""
  ].filter(Boolean);
}

function findRepoRootFrom(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const composeFile = path.join(currentDir, "docker-compose.desktop.yml");
    const envFile = path.join(currentDir, "desktop.env");

    if (fs.existsSync(composeFile) && fs.existsSync(envFile)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function resolveProjectPaths() {
  for (const startDir of getCandidateStartDirs()) {
    const repoRoot = findRepoRootFrom(startDir);
    if (!repoRoot) {
      continue;
    }

    return {
      repoRoot,
      composeFile: path.join(repoRoot, "docker-compose.desktop.yml"),
      envFile: path.join(repoRoot, "desktop.env")
    };
  }

  return null;
}

function getComposeArgs(extraArgs) {
  if (!projectPaths) {
    throw new Error("Launcher could not locate docker-compose.desktop.yml.");
  }

  return [
    "compose",
    "--env-file",
    projectPaths.envFile,
    "-f",
    projectPaths.composeFile,
    ...extraArgs
  ];
}

function trimOutput(text) {
  return text.trim().replace(/\r?\n/g, " ").trim();
}

function formatDockerError(error) {
  if (error.code === "ENOENT") {
    return {
      message: "Docker Desktop is required. Install it, then reopen the launcher.",
      detail: "The launcher could not find the Docker CLI on this computer."
    };
  }

  const detail = trimOutput(error.stderr || error.stdout || error.message || "Docker command failed.");

  if (/Cannot connect to the Docker daemon|dockerDesktopLinuxEngine|is the docker daemon running|error during connect/i.test(detail)) {
    return {
      message: "Docker Desktop is installed but not running. Open Docker Desktop and wait until it says it is running.",
      detail
    };
  }

  if (/compose is not a docker command/i.test(detail)) {
    return {
      message: "This Docker installation does not include Docker Compose v2.",
      detail
    };
  }

  return {
    message: detail || "Docker command failed.",
    detail
  };
}

function runDocker(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      cwd: projectPaths ? projectPaths.repoRoot : process.cwd(),
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(Object.assign(error, { stdout, stderr }));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        Object.assign(new Error(`docker exited with code ${code}`), {
          code,
          stdout,
          stderr
        })
      );
    });
  });
}

async function ensureDockerReady() {
  await runDocker(["--version"]);
  await runDocker(["compose", "version"]);
  await runDocker(["info"]);
}

async function queryStackState() {
  if (!projectPaths) {
    return {
      status: "Error",
      message: "Launcher files are incomplete. docker-compose.desktop.yml or desktop.env is missing.",
      lastError: ""
    };
  }

  try {
    const result = await runDocker(getComposeArgs(["ps", "--services", "--status", "running"]));
    const runningServices = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (runningServices.includes("app")) {
      return {
        status: "Running",
        message: `The app is running at ${APP_URL}`,
        lastError: ""
      };
    }

    return {
      status: "Stopped",
      message: "The app is stopped.",
      lastError: ""
    };
  } catch (error) {
    const formatted = formatDockerError(error);
    return {
      status: "Stopped",
      message: formatted.message,
      lastError: formatted.detail
    };
  }
}

async function waitForHealthCheck() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    try {
      const response = await fetch(HEALTH_URL, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch (_error) {
      // The app may still be starting.
    }

    await sleep(HEALTH_POLL_INTERVAL_MS);
  }

  throw new Error("Timed out while waiting for the app to respond on http://localhost:3000.");
}

function serializeAction(action) {
  currentAction = currentAction.then(action, action);
  return currentAction;
}

async function startStack() {
  return serializeAction(async () => {
    if (!projectPaths) {
      updateState({
        status: "Error",
        message: "Launcher files are incomplete. Re-extract the download and try again.",
        lastError: "docker-compose.desktop.yml or desktop.env could not be found."
      });
      return launcherState;
    }

    updateState({
      status: "Starting",
      message: "Checking Docker Desktop...",
      lastError: ""
    });

    try {
      await ensureDockerReady();

      updateState({
        status: "Starting",
        message: "Pulling Docker images...",
        lastError: ""
      });
      await runDocker(getComposeArgs(["pull"]));

      updateState({
        status: "Starting",
        message: "Starting the application...",
        lastError: ""
      });
      await runDocker(getComposeArgs(["up", "-d"]));

      updateState({
        status: "Starting",
        message: "Waiting for the app to become ready...",
        lastError: ""
      });
      await waitForHealthCheck();

      updateState({
        status: "Running",
        message: `The app is running at ${APP_URL}`,
        lastError: ""
      });
      await shell.openExternal(APP_URL);
    } catch (error) {
      const formatted = formatDockerError(error);
      updateState({
        status: "Error",
        message: formatted.message,
        lastError: formatted.detail
      });
    }

    return launcherState;
  });
}

async function stopStack() {
  return serializeAction(async () => {
    if (!projectPaths) {
      updateState({
        status: "Error",
        message: "Launcher files are incomplete. Re-extract the download and try again.",
        lastError: "docker-compose.desktop.yml or desktop.env could not be found."
      });
      return launcherState;
    }

    updateState({
      status: "Stopping",
      message: "Stopping the application...",
      lastError: ""
    });

    try {
      await ensureDockerReady();
      await runDocker(getComposeArgs(["down"]));
      updateState({
        status: "Stopped",
        message: "The app is stopped.",
        lastError: ""
      });
    } catch (error) {
      const formatted = formatDockerError(error);
      updateState({
        status: "Error",
        message: formatted.message,
        lastError: formatted.detail
      });
    }

    return launcherState;
  });
}

async function requestAppClose() {
  const stackState = await queryStackState();

  if (stackState.status !== "Running") {
    isClosing = true;
    app.quit();
    return;
  }

  const response = await dialog.showMessageBox(mainWindow, {
    type: "question",
    buttons: ["Keep Running", "Stop and Close", "Cancel"],
    defaultId: 0,
    cancelId: 2,
    title: "Close Launcher",
    message: "The condo application is still running.",
    detail: "Choose Keep Running to close only the launcher window, or Stop and Close to shut down the Docker containers first."
  });

  if (response.response === 0) {
    isClosing = true;
    app.quit();
    return;
  }

  if (response.response === 1) {
    await stopStack();
    if (launcherState.status !== "Error") {
      isClosing = true;
      app.quit();
    }
  }
}

app.whenReady().then(async () => {
  app.setName("Condo Desktop Launcher");
  projectPaths = resolveProjectPaths();
  createWindow();

  const initialState = await queryStackState();
  updateState(initialState);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    const refreshedState = await queryStackState();
    updateState(refreshedState);
  }
});

ipcMain.handle("launcher:get-state", async () => launcherState);
ipcMain.handle("launcher:start", async () => startStack());
ipcMain.handle("launcher:stop", async () => stopStack());
ipcMain.handle("launcher:close", async () => {
  await requestAppClose();
  return launcherState;
});
