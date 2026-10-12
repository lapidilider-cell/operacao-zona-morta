const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let gameOpened = false;
let updateState = 'checking';
let updaterStarted = false;
let checkTimeout;

const splashHtml = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atualizando</title><style>*{box-sizing:border-box}body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 35%,#17271e,#050807 72%);color:#eef5ed;font-family:Arial,sans-serif}.card{width:min(560px,90vw);padding:38px;border:1px solid #65794e;background:#08100ff2;box-shadow:0 0 70px #000}.eyebrow{font-size:11px;letter-spacing:4px;color:#d7ff57;font-weight:bold}.title{font-size:34px;font-weight:900;letter-spacing:-1px;margin:14px 0}.title span{color:#d7ff57}.status{color:#c1ccc3;line-height:1.5;min-height:42px}.bar{height:8px;background:#202b24;margin-top:24px;overflow:hidden}.fill{height:100%;width:30%;background:#d7ff57;animation:pulse 1.2s ease-in-out infinite alternate}@keyframes pulse{from{width:18%}to{width:82%}}.foot{font-size:10px;color:#809083;letter-spacing:2px;margin-top:22px}</style><div class="card"><div class="eyebrow">PROTOCOLO DE CONTENÇÃO</div><div class="title">OPERAÇÃO: <span>ZONA MORTA</span></div><div id="status" class="status">Verificando atualizações antes de iniciar o jogo…</div><div class="bar"><div class="fill"></div></div><div class="foot">NÃO FECHE ESTA JANELA DURANTE A ATUALIZAÇÃO</div></div></html>`;

function setStatus(message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const safe = JSON.stringify(String(message));
  mainWindow.webContents.executeJavaScript(`document.getElementById('status').textContent=${safe}`).catch(() => {});
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900, height: 540, minWidth: 720, minHeight: 460,
    title: 'Operação: Zona Morta — Atualizador',
    backgroundColor: '#05090b', autoHideMenuBar: true,
    resizable: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  mainWindow.removeMenu();
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function openGame() {
  if (gameOpened || !mainWindow || mainWindow.isDestroyed()) return;
  gameOpened = true;
  clearTimeout(checkTimeout);
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(960, 640);
  mainWindow.setSize(1440, 900);
  mainWindow.setTitle('Operação: Zona Morta — Edição Inferno');
  mainWindow.loadFile(path.join(__dirname, 'game.html'));
}

async function configureAutoUpdates() {
  if (!app.isPackaged) {
    console.log('[Atualizador] Modo desenvolvimento: verificação desativada.');
    openGame();
    return;
  }

  try {
    const { autoUpdater } = require('electron-updater');
    if (updaterStarted) return;
    updaterStarted = true;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = false;

    checkTimeout = setTimeout(() => {
      if (updateState === 'checking') {
        updateState = 'fallback';
        setStatus('Não foi possível confirmar atualizações agora. Abrindo o jogo instalado…');
        setTimeout(openGame, 900);
      }
    }, 20000);

    autoUpdater.on('checking-for-update', () => {
      updateState = 'checking';
      setStatus('Verificando atualizações antes de iniciar o jogo…');
    });
    autoUpdater.on('update-available', (info) => {
      updateState = 'downloading';
      clearTimeout(checkTimeout);
      setStatus(`Nova versão ${info.version} encontrada. Baixando e preparando a instalação…`);
    });
    autoUpdater.on('download-progress', (progress) => {
      setStatus(`Baixando atualização: ${Math.round(progress.percent)}% concluído. O jogo abrirá depois da instalação.`);
    });
    autoUpdater.on('update-not-available', () => {
      updateState = 'current';
      clearTimeout(checkTimeout);
      setStatus('Jogo atualizado. Iniciando…');
      setTimeout(openGame, 650);
    });
    autoUpdater.on('update-downloaded', (info) => {
      updateState = 'installing';
      setStatus(`Versão ${info.version} pronta. Instalando antes de abrir o jogo…`);
      setTimeout(() => autoUpdater.quitAndInstall(false, true), 700);
    });
    autoUpdater.on('error', (error) => {
      console.error('[Atualizador] Erro:', error?.message || error);
      setStatus(updateState === 'downloading' || updateState === 'installing'
        ? 'Não foi possível concluir a atualização. Abrindo a versão instalada…'
        : 'Atualização indisponível no momento. Abrindo o jogo instalado…');
      updateState = 'fallback';
      clearTimeout(checkTimeout);
      setTimeout(openGame, 1200);
    });

    setStatus('Conectando ao servidor de atualizações…');
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[Atualizador] Falha ao iniciar:', error?.message || error);
    clearTimeout(checkTimeout);
    setStatus('Atualizador indisponível. Abrindo o jogo instalado…');
    setTimeout(openGame, 900);
  }
}

app.whenReady().then(async () => {
  createWindow();
  await configureAutoUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gameOpened = false;
      createWindow();
      configureAutoUpdates();
    }
  });
});
app.on('window-all-closed', () => {
  clearTimeout(checkTimeout);
  if (process.platform !== 'darwin') app.quit();
});
