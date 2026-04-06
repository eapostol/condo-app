const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const APP_URL = "http://localhost:3000";
const HEALTH_URL = `${APP_URL}/api/health`;
const STARTUP_TIMEOUT_MS = 120000;
const HEALTH_POLL_INTERVAL_MS = 2000;
const DOCKER_IDLE_TIMEOUT_MS = 180000;

let mainWindow = null;
let isClosing = false;
let currentAction = Promise.resolve();
let projectPaths = null;
let logFilePath = "";
let launcherState = {
  status: "Stopped",
  phase: "Idle",
  progressPercent: 0,
  message: "Checking launcher environment...",
  detail: "",
  lastError: "",
  logPath: ""
};

function ensureLogFilePath() {
  if (!app.isReady()) {
    return "";
  }

  if (logFilePath) {
    return logFilePath;
  }

  const logDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  logFilePath = path.join(logDir, "launcher.ndjson");
  return logFilePath;
}

function appendLog(level, event, payload = {}) {
  const filePath = ensureLogFilePath();
  if (!filePath) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload
  };

  try {
    fs.appendFileSync(filePath, `${JSON.stringify(entry)}${os.EOL}`);
  } catch (_error) {
    // Logging should never block the launcher.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 680,
    minWidth: 520,
    minHeight: 520,
    resizable: true,
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
  launcherState = {
    ...launcherState,
    ...patch,
    logPath: ensureLogFilePath() || launcherState.logPath || ""
  };

  appendLog("info", "launcher.state", {
    status: launcherState.status,
    phase: launcherState.phase,
    progress_percent: launcherState.progressPercent,
    message: launcherState.message,
    detail: launcherState.detail,
    error: launcherState.lastError || undefined
  });

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
  const detail = trimOutput(error.stderr || error.stdout || error.message || "Docker command failed.");

  if (error.code === "ENOENT") {
    return {
      message: "Docker Desktop is required. Install it, then reopen the launcher.",
      detail: "The launcher could not find the Docker CLI on this computer."
    };
  }

  if (error.code === "ETIMEDOUT") {
    return {
      message: "Docker stopped reporting progress. Open the log file for details and retry once Docker Desktop is responsive.",
      detail
    };
  }

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

function runDocker(args, options = {}) {
  const {
    logPhase = "docker",
    onLine,
    idleTimeoutMs = 0
  } = options;

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn("docker", args, {
      cwd: projectPaths ? projectPaths.repoRoot : process.cwd(),
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let lastActivityAt = Date.now();
    let settled = false;

    appendLog("info", "docker.command.start", {
      phase: logPhase,
      command: ["docker", ...args].join(" ")
    });

    const finish = (handler) => (value) => {
      if (settled) {
        return;
      }
      settled = true;
      if (idleTimer) {
        clearInterval(idleTimer);
      }
      handler(value);
    };

    const flushBufferedLines = (stream) => {
      const isStdout = stream === "stdout";
      const pending = isStdout ? stdoutBuffer : stderrBuffer;
      const line = pending.trim();
      if (!line) {
        return;
      }

      appendLog("info", "docker.command.output", {
        phase: logPhase,
        stream,
        line
      });
      if (onLine) {
        onLine({ stream, line });
      }
    };

    const handleChunk = (stream, chunk) => {
      const text = chunk.toString();
      lastActivityAt = Date.now();

      if (stream === "stdout") {
        stdout += text;
        stdoutBuffer += text;
      } else {
        stderr += text;
        stderrBuffer += text;
      }

      const parts = (stream === "stdout" ? stdoutBuffer : stderrBuffer).split(/\r?\n/);
      const remainder = parts.pop();

      if (stream === "stdout") {
        stdoutBuffer = remainder;
      } else {
        stderrBuffer = remainder;
      }

      for (const rawLine of parts) {
        const line = rawLine.trim();
        if (!line) {
          continue;
        }

        appendLog("info", "docker.command.output", {
          phase: logPhase,
          stream,
          line
        });
        if (onLine) {
          onLine({ stream, line });
        }
      }
    };

    child.stdout.on("data", (chunk) => handleChunk("stdout", chunk));
    child.stderr.on("data", (chunk) => handleChunk("stderr", chunk));

    const idleTimer = idleTimeoutMs
      ? setInterval(() => {
          if (Date.now() - lastActivityAt < idleTimeoutMs) {
            return;
          }

          child.kill();
          finish(reject)(
            Object.assign(new Error(`docker command timed out after ${idleTimeoutMs} ms without progress.`), {
              code: "ETIMEDOUT",
              stdout,
              stderr
            })
          );
        }, 5000)
      : null;

    child.on("error", (error) => {
      finish(reject)(Object.assign(error, { stdout, stderr }));
    });

    child.on("close", (code) => {
      flushBufferedLines("stdout");
      flushBufferedLines("stderr");

      const durationMs = Date.now() - startedAt;
      appendLog(code === 0 ? "info" : "error", "docker.command.finish", {
        phase: logPhase,
        command: ["docker", ...args].join(" "),
        exit_code: code,
        duration_ms: durationMs
      });

      if (code === 0) {
        finish(resolve)({ stdout, stderr, durationMs });
        return;
      }

      finish(reject)(
        Object.assign(new Error(`docker exited with code ${code}`), {
          code,
          stdout,
          stderr,
          durationMs
        })
      );
    });
  });
}

async function ensureDockerReady() {
  await runDocker(["--version"], { logPhase: "docker-version" });
  await runDocker(["compose", "version"], { logPhase: "compose-version" });
  await runDocker(["info"], { logPhase: "docker-info", idleTimeoutMs: 60000 });
}

async function queryStackState() {
  if (!projectPaths) {
    return {
      status: "Error",
      phase: "Error",
      progressPercent: 0,
      message: "Launcher files are incomplete. docker-compose.desktop.yml or desktop.env is missing.",
      detail: "",
      lastError: "",
      logPath: ensureLogFilePath() || ""
    };
  }

  try {
    const result = await runDocker(getComposeArgs(["ps", "--services", "--status", "running"]), {
      logPhase: "stack-ps",
      idleTimeoutMs: 60000
    });
    const runningServices = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (runningServices.includes("app")) {
      return {
        status: "Running",
        phase: "Running",
        progressPercent: 100,
        message: `The app is running at ${APP_URL}`,
        detail: "The desktop stack is already up.",
        lastError: "",
        logPath: ensureLogFilePath() || ""
      };
    }

    return {
      status: "Stopped",
      phase: "Idle",
      progressPercent: 0,
      message: "The app is stopped.",
      detail: "",
      lastError: "",
      logPath: ensureLogFilePath() || ""
    };
  } catch (error) {
    const formatted = formatDockerError(error);
    return {
      status: "Stopped",
      phase: "Idle",
      progressPercent: 0,
      message: formatted.message,
      detail: "",
      lastError: formatted.detail,
      logPath: ensureLogFilePath() || ""
    };
  }
}

async function waitForHealthCheck(onPoll) {
  const startedAt = Date.now();
  let attempts = 0;

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    attempts += 1;
    const elapsedMs = Date.now() - startedAt;

    if (onPoll) {
      onPoll({ attempts, elapsedMs });
    }

    try {
      const response = await fetch(HEALTH_URL, { method: "GET" });
      if (response.ok) {
        appendLog("info", "health.success", {
          url: HEALTH_URL,
          attempts,
          duration_ms: elapsedMs
        });
        return;
      }
    } catch (_error) {
      // The app may still be starting.
    }

    await sleep(HEALTH_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out while waiting for the app to respond on ${APP_URL}.`);
}

function serializeAction(action) {
  currentAction = currentAction.then(action, action);
  return currentAction;
}

function makeProgressUpdater({ message, phase, startPercent, maxPercent }) {
  let currentPercent = startPercent;

  return (line) => {
    if (currentPercent < maxPercent) {
      currentPercent += 1;
    }

    updateState({
      status: "Starting",
      phase,
      progressPercent: currentPercent,
      message,
      detail: line,
      lastError: ""
    });
  };
}

async function startStack() {
  return serializeAction(async () => {
    if (!projectPaths) {
      updateState({
        status: "Error",
        phase: "Error",
        progressPercent: 0,
        message: "Launcher files are incomplete. Re-extract the download and try again.",
        detail: "",
        lastError: "docker-compose.desktop.yml or desktop.env could not be found."
      });
      return launcherState;
    }

    updateState({
      status: "Starting",
      phase: "Check",
      progressPercent: 5,
      message: "Checking Docker Desktop...",
      detail: "Verifying Docker Desktop and Docker Compose are available.",
      lastError: ""
    });

    try {
      await ensureDockerReady();

      updateState({
        status: "Starting",
        phase: "Pull",
        progressPercent: 20,
        message: "Pulling Docker images...",
        detail: "Checking Docker Hub for updated images.",
        lastError: ""
      });
      const updatePullProgress = makeProgressUpdater({
        message: "Pulling Docker images...",
        phase: "Pull",
        startPercent: 20,
        maxPercent: 55
      });
      await runDocker(getComposeArgs(["pull"]), {
        logPhase: "pull",
        idleTimeoutMs: DOCKER_IDLE_TIMEOUT_MS,
        onLine: ({ line }) => updatePullProgress(line)
      });

      updateState({
        status: "Starting",
        phase: "Start",
        progressPercent: 60,
        message: "Starting the application...",
        detail: "Creating and starting containers.",
        lastError: ""
      });
      const updateStartProgress = makeProgressUpdater({
        message: "Starting the application...",
        phase: "Start",
        startPercent: 60,
        maxPercent: 80
      });
      await runDocker(getComposeArgs(["up", "-d"]), {
        logPhase: "up",
        idleTimeoutMs: DOCKER_IDLE_TIMEOUT_MS,
        onLine: ({ line }) => updateStartProgress(line)
      });

      updateState({
        status: "Starting",
        phase: "Health",
        progressPercent: 82,
        message: "Waiting for the app to become ready...",
        detail: `Checking ${HEALTH_URL}`,
        lastError: ""
      });
      await waitForHealthCheck(({ attempts, elapsedMs }) => {
        const ratio = Math.min(1, elapsedMs / STARTUP_TIMEOUT_MS);
        const progressPercent = Math.min(97, 82 + Math.floor(ratio * 15));
        updateState({
          status: "Starting",
          phase: "Health",
          progressPercent,
          message: "Waiting for the app to become ready...",
          detail: `Health checks completed: ${attempts}`,
          lastError: ""
        });
      });

      updateState({
        status: "Running",
        phase: "Running",
        progressPercent: 100,
        message: `The app is running at ${APP_URL}`,
        detail: "Opening the browser.",
        lastError: ""
      });
      await shell.openExternal(APP_URL);
    } catch (error) {
      const formatted = formatDockerError(error);
      updateState({
        status: "Error",
        phase: "Error",
        progressPercent: launcherState.progressPercent,
        message: formatted.message,
        detail: launcherState.detail,
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
        phase: "Error",
        progressPercent: 0,
        message: "Launcher files are incomplete. Re-extract the download and try again.",
        detail: "",
        lastError: "docker-compose.desktop.yml or desktop.env could not be found."
      });
      return launcherState;
    }

    updateState({
      status: "Stopping",
      phase: "Stop",
      progressPercent: 15,
      message: "Stopping the application...",
      detail: "Stopping Docker containers.",
      lastError: ""
    });

    try {
      await ensureDockerReady();
      let stopProgress = 15;
      await runDocker(getComposeArgs(["down"]), {
        logPhase: "down",
        idleTimeoutMs: DOCKER_IDLE_TIMEOUT_MS,
        onLine: ({ line }) => {
          stopProgress = Math.min(90, stopProgress + 5);
          updateState({
            status: "Stopping",
            phase: "Stop",
            progressPercent: stopProgress,
            message: "Stopping the application...",
            detail: line,
            lastError: ""
          });
        }
      });
      updateState({
        status: "Stopped",
        phase: "Idle",
        progressPercent: 0,
        message: "The app is stopped.",
        detail: "",
        lastError: ""
      });
    } catch (error) {
      const formatted = formatDockerError(error);
      updateState({
        status: "Error",
        phase: "Error",
        progressPercent: launcherState.progressPercent,
        message: formatted.message,
        detail: launcherState.detail,
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
  ensureLogFilePath();
  appendLog("info", "launcher.ready", { log_path: ensureLogFilePath() });
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
