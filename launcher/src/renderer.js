const statePill = document.getElementById("status-pill");
const progressValue = document.getElementById("progress-value");
const progressBar = document.getElementById("progress-bar");
const statusMessage = document.getElementById("status-message");
const statusDetail = document.getElementById("status-detail");
const statusError = document.getElementById("status-error");
const logPath = document.getElementById("log-path");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const closeButton = document.getElementById("close-button");

const busyStates = new Set(["Starting", "Stopping"]);

function normaliseStatusClass(status) {
  return `status-${status.toLowerCase()}`;
}

function renderState(state) {
  const progressPercent = Math.max(0, Math.min(100, Number(state.progressPercent || 0)));

  statePill.textContent = state.status;
  statePill.className = `status-pill ${normaliseStatusClass(state.status)}`;
  progressValue.textContent = `${progressPercent}%`;
  progressBar.style.width = `${progressPercent}%`;
  statusMessage.textContent = state.message;

  if (state.detail) {
    statusDetail.textContent = state.detail;
    statusDetail.classList.remove("hidden");
  } else {
    statusDetail.textContent = "";
    statusDetail.classList.add("hidden");
  }

  if (state.lastError) {
    statusError.textContent = state.lastError;
    statusError.classList.remove("hidden");
  } else {
    statusError.textContent = "";
    statusError.classList.add("hidden");
  }

  if (state.logPath) {
    logPath.textContent = `Log file: ${state.logPath}`;
    logPath.classList.remove("hidden");
  } else {
    logPath.textContent = "";
    logPath.classList.add("hidden");
  }

  startButton.disabled = state.status === "Running" || busyStates.has(state.status);
  stopButton.disabled = state.status === "Stopped" || busyStates.has(state.status);
  closeButton.disabled = false;
}

async function runAction(button, action) {
  const originalText = button.textContent;
  button.disabled = true;

  try {
    const nextState = await action();
    renderState(nextState);
  } finally {
    button.textContent = originalText;
  }
}

window.launcherApi.onStateChanged(renderState);

startButton.addEventListener("click", async () => {
  await runAction(startButton, () => window.launcherApi.start());
});

stopButton.addEventListener("click", async () => {
  await runAction(stopButton, () => window.launcherApi.stop());
});

closeButton.addEventListener("click", async () => {
  await window.launcherApi.close();
});

window.launcherApi.getState().then(renderState);
