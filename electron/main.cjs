// Electron main process: one plain, normal window. Nothing else.
//
// Anti-cheat stance (README "Fair play"): no game memory reads, no injection, no hooks, no access to game files or
// processes, no always-on-top or transparent overlay over the game, and no screen capture in v1. Every permission
// request from the page (including display / screen capture) is refused.
const { app, BrowserWindow, session, shell } = require('electron');
const path = require('node:path');

const DEV = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:5174';

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 760,
    minWidth: 420,
    minHeight: 520,
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0c0f',
    title: 'Finals Blueprint',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);

  // Links open in the system browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV) win.loadURL(DEV_URL);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  // getDisplayMedia from the page: always refused (no capture in v1)
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => callback({}));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
