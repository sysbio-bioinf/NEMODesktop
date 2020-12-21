const { ipcMain, dialog } = require("electron");

ipcMain.on("open-information-dialog", event => {
  const options = {
    type: "info",
    title: "Information",
    message: "Das ist eine Information...Ist es OK?",
    buttons: ["Ja", "Nein"]
  };
  dialog.showMessageBox(options, index => {
    event.sender.send("information-dialog-selection", index);
  });
});
