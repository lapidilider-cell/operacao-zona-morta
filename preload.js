const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('modelBridge', {
  loadHumanModel: () => ipcRenderer.invoke('load-human-model')
});
