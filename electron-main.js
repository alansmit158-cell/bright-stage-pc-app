import electron from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const http = require('http');
const https = require('https');

const { app, BrowserWindow, ipcMain, shell } = electron;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        autoHideMenuBar: true,
        backgroundColor: '#0d0d12'
    });

    // In dev, try current vite ports
    win.loadURL('http://localhost:5173').catch(() => {
        win.loadURL('http://localhost:5174').catch(() => {
            win.loadURL('http://localhost:5175');
        });
    });
}

// IPC handler: Open PDF URL in the system browser (Edge/Chrome — NOT Electron's Chromium)
// This bypasses IDM's Electron integration entirely
ipcMain.handle('open-pdf-external', async (event, { url }) => {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// IPC handler: Download PDF via Node.js http directly to the Downloads folder
ipcMain.handle('download-pdf', async (event, { url, filename }) => {
    try {
        const downloadsDir = app.getPath('downloads');
        const filePath = path.join(downloadsDir, filename);

        await new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(filePath);

            protocol.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Server returned ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        });

        await shell.openPath(filePath);
        return { success: true, path: filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
