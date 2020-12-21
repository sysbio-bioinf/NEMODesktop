const { BrowserWindow, Menu, MenuItem, ipcMain, app } = require("electron");

const menu = new Menu();
menu.append(new MenuItem({ role: 'copy',
                          label: 'Kopieren' })
                          );
menu.append(new MenuItem({role: 'paste',
                          label: 'Einfügen'  })
                          );
menu.append(new MenuItem({ role: 'selectall',
                          label: 'Alles markieren'})
);
menu.append(new MenuItem({role: 'zoomIn',
                          label: 'Vergrößern'  })
);
 menu.append(new MenuItem({role: 'zoomOut',
                          label: 'Verkleinern'  })
);                          
menu.append(new MenuItem({ role: 'minimize',
                          label: 'Minimieren'})
);

app.on("browser-window-created", (event, win) => {
  win.webContents.on("context-menu", (e, params) => {
    menu.popup(win, params.x, params.y);
  });
});

ipcMain.on("show-context-menu", event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  menu.popup(win);
});
