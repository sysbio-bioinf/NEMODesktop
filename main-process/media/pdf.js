const {dialog} = require("electron");
const electron = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {BrowserWindow, ipcMain, shell} = require('electron');

ipcMain.on('print-to-pdf', (event) => {
  //const pdfPath = path.join(os.tmpdir(), 'print.pdf')
  const configDir =  (electron.app || electron.remote.app).getPath('userData');
  const pdf_path = path.join(configDir,"output.pdf");
    
   /* dialog.showSaveDialog(null, options, (path) => {
        console.log(path);
        pathname = path;
    });*/

    var pdfPath = dialog.showSaveDialog( {
        title: "PDF speichern",
        filters: [ { name:"PDF-Dateien", ext: [ "pdf" ] } ], // what kind of files do you want to see when this box is opend
        defaultPath: pdf_path // the default path to save file
    });

    if ( ! pdfPath ) {
        // path is undefined
        event.sender.send('not-wrote-pdf', pdfPath);
        return;
    }

  const win = BrowserWindow.fromWebContents(event.sender)
  // Use default printing options
  win.webContents.printToPDF({
    marginsType: 1,
    printBackground: false,
    printSelectionOnly: false,
    landscape: false
  }, (error, data) => {
    if (error) throw error
    fs.writeFile(pdfPath, data, (error) => {
      if (error) throw error
      shell.openExternal(`file://${pdfPath}`)
      event.sender.send('wrote-pdf', pdfPath)
    })
  })
});
