const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("launcherApi", {
  getState: () => ipcRenderer.invoke("launcher:get-state"),
  start: () => ipcRenderer.invoke("launcher:start"),
  stop: () => ipcRenderer.invoke("launcher:stop"),
  close: () => ipcRenderer.invoke("launcher:close"),
  onStateChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("launcher:state-changed", listener);
    return () => ipcRenderer.removeListener("launcher:state-changed", listener);
  }
});
