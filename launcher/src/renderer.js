const statePill = document.getElementById("status-pill");
const statusMessage = document.getElementById("status-message");
const statusError = document.getElementById("status-error");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const closeButton = document.getElementById("close-button");

const busyStates = new Set(["Starting", "Stopping"]);

function normaliseStatusClass(status) {
  return `status-${status.toLowerCase()}`;
}

function renderState(state) {
  statePill.textContent = state.status;
  statePill.className = `status-pill ${normaliseStatusClass(state.status)}`;
  statusMessage.textContent = state.message;

  if (state.lastError) {
    statusError.textContent = state.lastError;
    statusError.classList.remove("hidden");
  } else {
    statusError.textContent = "";
    statusError.classList.add("hidden");
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
