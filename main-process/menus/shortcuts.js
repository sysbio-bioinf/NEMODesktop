const { app, dialog, globalShortcut } = require("electron");

app.on("ready", () => {
  globalShortcut.register("CommandOrControl+Alt+K", () => {
    dialog.showMessageBox({
      type: "info",
      message: "Erfolgreich!",
      detail: "Sie haben die registrierte globale Tastenkombination gedrückt.",
      buttons: ["OK"]
    });
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
