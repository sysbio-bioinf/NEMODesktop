const { BrowserWindow, Menu, app, shell, dialog } = require("electron");

let template = [
  {
    label: "Bearbeiten",
    submenu: [
      {
        label: "Rückgängig",
        accelerator: "CmdOrCtrl+Z",
        role: "undo"
      },
      {
        label: "Wiederholen",
        accelerator: "Shift+CmdOrCtrl+Z",
        role: "redo"
      },
      {
        type: "separator"
      },
      {
        label: "Schneiden",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
      },
      {
        label: "Kopieren",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
      },
      {
        label: "Hinzufügen",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      },
      {
        label: "Alles wählen",
        accelerator: "CmdOrCtrl+A",
        role: "selectall"
      }
    ]
  },
  {
    label: "Ansicht",
    submenu: [
      {
        label: "Neu laden",
        accelerator: "CmdOrCtrl+R",
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            // on reload, start fresh and close any old
            // open secondary windows
            if (focusedWindow.id === 1) {
              BrowserWindow.getAllWindows().forEach(win => {
                if (win.id > 1) win.close();
              });
            }
            focusedWindow.reload();
          }
        }
      },
      {
        label: "Vollbild umschalten",
        accelerator: (() => {
          if (process.platform === "darwin") {
            return "Ctrl+Command+F";
          } else {
            return "F11";
          }
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        }
      },
      {
        label: "Entwickler Tools umschalten",
        accelerator: (() => {
          if (process.platform === "darwin") {
            return "Alt+Command+I";
          } else {
            return "Ctrl+Shift+I";
          }
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.toggleDevTools();
          }
        }
      },
      {
        type: "separator"
      },
      {
        label: "App Menu NEMO",
        click: function(item, focusedWindow) {
          if (focusedWindow) {
            const options = {
              type: "info",
              title: "Application Menu Demo",
              buttons: ["Ok"],
              message:
                "This demo is for the Menu section, showing how to create a clickable menu item in the application menu."
            };
            dialog.showMessageBox(focusedWindow, options, function() {});
          }
        }
      }
    ]
  },
  {
    label: "Fenster",
    role: "window",
    submenu: [
      {
        label: "Minimieren",
        accelerator: "CmdOrCtrl+M",
        role: "minimize"
      },
      {
        label: "Schließen",
        accelerator: "CmdOrCtrl+W",
        role: "close"
      },
      {
        type: "separator"
      },
      {
        label: "Fenster wieder öffnen",
        accelerator: "CmdOrCtrl+Shift+T",
        enabled: false,
        key: "reopenMenuItem",
        click: () => {
          app.emit("activate");
        }
      }
    ]
  },
  {
    label: "Hilfe",
    role: "help",
    submenu: [
      {
        label: "Lern mehr",
        click: () => {
          shell.openExternal("http://electron.atom.io");
        }
      }
    ]
  }
];

function addUpdateMenuItems(items, position) {
  if (process.mas) return;

  const version = app.getVersion();
  let updateItems = [
    {
      label: `Version ${version}`,
      enabled: false
    },
    {
      label: "Update überprüfen",
      enabled: false,
      key: "checkingForUpdate"
    },
    {
      label: "Updates überprüfen",
      visible: false,
      key: "checkForUpdate",
      click: () => {
        require("electron").autoUpdater.checkForUpdates();
      }
    },
    {
      label: "Erneut Update starten und installieren",
      enabled: true,
      visible: false,
      key: "restartToUpdate",
      click: () => {
        require("electron").autoUpdater.quitAndInstall();
      }
    }
  ];

  items.splice.apply(items, [position, 0].concat(updateItems));
}

function findReopenMenuItem() {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  let reopenMenuItem;
  menu.items.forEach(item => {
    if (item.submenu) {
      item.submenu.items.forEach(item => {
        if (item.key === "reopenMenuItem") {
          reopenMenuItem = item;
        }
      });
    }
  });
  return reopenMenuItem;
}

if (process.platform === "darwin") {
  // const name = app.getName()
  const name = "NEMO";
  template.unshift({
    label: name,
    submenu: [
      {
        label: `About ${name}`,
        role: "about"
      },
      {
        type: "separator"
      },
      {
        label: "Services",
        role: "services",
        submenu: []
      },
      {
        type: "separator"
      },
      {
        label: `Verbergen ${name}`,
        accelerator: "Command+H",
        role: "hide"
      },
      {
        label: "Verbergen andere",
        accelerator: "Command+Alt+H",
        role: "hideothers"
      },
      {
        label: "Alle anschauen",
        role: "unhide"
      },
      {
        type: "separator"
      },
      {
        label: "Verlassen",
        accelerator: "Command+Q",
        click: () => {
          app.quit();
        }
      }
    ]
  });

  // Window menu.
  template[3].submenu.push(
    {
      type: "separator"
    },
    {
      label: "Bringen alles nach vorne",
      role: "front"
    }
  );

  addUpdateMenuItems(template[0].submenu, 1);
}

if (process.platform === "win32") {
  const helpMenu = template[template.length - 1].submenu;
  addUpdateMenuItems(helpMenu, 0);
}

app.on("ready", () => {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on("browser-window-created", () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = false;
});

app.on("window-all-closed", () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = true;
});
