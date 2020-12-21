// only add update server if it's not being run from cli
if (require.main !== module) {
  require("update-electron-app")({
    logger: require("electron-log")
  });
}

const path = require("path");
const glob = require("glob");
const electron = require("electron");
const {ipcMain} = require("electron");
const { app, BrowserWindow } = require("electron");
const database = require(path.resolve(__dirname, "database"));

const debug = /--debug/.test(process.argv[2]);

if (process.mas) app.setName("Electron APIs");

let mainWindow = null;

function initialize() {

  makeSingleInstance();

  loadDemos();

  function createWindow() {
    const windowOptions = {
      width: 1600,
      //minWidth: 1080, //680
      height: 960, //840
      title: app.getName(),
      webPreferences: {
        nodeIntegration: true
      }
};

    if (process.platform === "linux") {
      windowOptions.icon = path.join(__dirname, "/assets/app-icon/png/512.png");
    }

    mainWindow = new BrowserWindow(windowOptions);
    //mainWindow.webContents.openDevTools();
    mainWindow.loadURL(path.join("file://", __dirname, "/index.html"));

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      mainWindow.webContents.openDevTools();
      mainWindow.maximize();
      require("devtron").install();
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
      app.quit();
    });
  }

  app.on("ready", () => {
    createWindow();
    //Window used to edit the data specific to each participant
    var editWindow = new BrowserWindow({
      width:600,
      height:600,
      show: false,
      frame: false,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    //Window used to edit the data specific to each participant
    var QRWindow = new BrowserWindow({
      width:900,
      height:800,
      show: false,
      frame: false,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    var ScoreInfoWindow = new BrowserWindow({
      width:1600,
      height:800,
      show: false,
      frame: false,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    var PDFPresetWindow = new BrowserWindow({
      width:800,
      height:600,
      show: false,
      frame: false,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    var NewPDFPresetWindow = new BrowserWindow({
      width:600,
      height:400,
      show: false,
      frame: false,
      parent: PDFPresetWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    var PDFWindow = new BrowserWindow({
      width:595,
      height:842,
      show: false,
      frame: false,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    editWindow.loadURL('file://' + __dirname + '/sections/visualisation/new-patient-data.html');
    
    //editWindow.webContents.openDevTools();

    ipcMain.on('edit-data', function (event, arg) {
      editWindow.webContents.send('update-id', arg);
      editWindow.show();
    });

    ipcMain.on('hide-window', function () {
      editWindow.hide();
    });

    ScoreInfoWindow.loadURL('file://' + __dirname + '/sections/visualisation/info-scoring.html');

    ipcMain.on('open-info-scoring', function () {
      ScoreInfoWindow.show();
    });

    ipcMain.on('hide-info-scoring', function () {
      ScoreInfoWindow.hide();
    });


    QRWindow.loadURL('file://' + __dirname + '/sections/interface/qrcode_reader.html');

    ipcMain.on('start-qrcode-reader', function (event, arg) {
      //QRWindow.webContents.openDevTools();
      QRWindow.webContents.send('checkbox-content', arg);
      QRWindow.show();
    });

    ipcMain.on('hide-qrwindow', function () {
      QRWindow.webContents.send('resetNewcnt',0);
      QRWindow.hide();
    });

    ipcMain.on('saveQREntries', function(event, arg) {

      lala = arg

      mainWindow.webContents.send('QRcodeData', lala);
      //database.addVisit(arg[2][1]);
      //arg[0] = entries
      /*for (var idx = 0; idx < arg[0].length; idx++) {
        database.addEntry(arg[0][idx]);
        console.log(arg[0][idx])
      }*/
      //arg[1] = medication updates
      /*for (var idx = 0; idx < arg[1].length; idx++) {
        database.addMedicationUpdate(arg[1][idx]);
      }
      //arg[2] = visits
      for (var idx = 0; idx < arg[2].length; idx++) {
        database.addVisit(arg[2][idx]);
      }*/
    });
    // <- add-patient
    ipcMain.on('addPatientToDb', function(event,arg) {
      mainWindow.webContents.send('addPatientV',arg); // -> data-visualisation
    });
    // <- data-visualisation
    ipcMain.on('patientAdded', function(event,arg) {
      mainWindow.webContents.send('patientAddedConfirm',arg); //-> add-patient
    });

    // <- edit-patient -> data-visualisation
    ipcMain.on('patient-data-edited', function(event,arg) {
      mainWindow.webContents.send('patientEditedConfirmV');
    });

    // <- data-visualisation -> add-patient
    ipcMain.on('confirm-patient-edited', function(event,arg) {
      mainWindow.webContents.send('patientAddConfirmEdit',arg);
    });

    // <- qrcode_reader
    ipcMain.on('checkID', function(event,arg) {
      mainWindow.webContents.send('checkIDV',arg); //-> data-visualisation
    });

    // <- data-visualisation
    ipcMain.on('checkIDconf', function(event,arg) {
      QRWindow.webContents.send('checkIDconfQR',arg); //-> qrcode_reader
    });

    // -> data-visualisation: reads all entries, visits and medUpdates for a specific patient
    ipcMain.on('getEntries', function(event, arg) {
	    mainWindow.webContents.send('getEntriesV',arg);
    });

   // -> data-visualisation: submit DB entries and QR entries
   ipcMain.on('submitDBandQR',function(event,arg) {
	    mainWindow.webContents.send('submitDBandQRV',arg);
   });

    // -> qrcode_reader.js: submit confirmation (if QR Code is new or not) to QR Code window
    ipcMain.on('confirm', function(event, arg) {
      QRWindow.webContents.send('QRcodeConfirmation', arg);
    });

    // -> data-visualisation: save visit date
    ipcMain.on('saveVisit', function(event,arg) {
	    mainWindow.webContents.send('saveVisitV',arg);
    });

    // -> data-visualisation: save PDF preset
    ipcMain.on('new-preset-to-DB', function(event,arg) {
      mainWindow.webContents.send('savePDFPresetV',arg);
    });

    // -> new-pdf-preset.js: confirm that new PDF preset is saved (or error occured)
    ipcMain.on('confirmNewPDFPreset',function (event,arg) {
      NewPDFPresetWindow.webContents.send('new-pdf-confirmation',arg);
    });

    // -> data-visualisation: get all current PDF presets in database to update "PDF preset" window
    ipcMain.on('update-pdf-presets',function (event,arg) {
      mainWindow.webContents.send('getPDFPresetsV',arg);
    });

    // -> pdf-preset: send all current PDF-Presets from database to PDF preset window
    ipcMain.on('sendPDFPresetsBack', function(event,arg) {
      PDFPresetWindow.webContents.send('sendPDFPresets',arg);
    });

    PDFPresetWindow.loadURL('file://' +__dirname + '/sections/visualisation/pdf-preset.html');

    ipcMain.on('pdf-preset-window', function (event, arg) {
      PDFPresetWindow.webContents.send('pdf-data', arg); 
      PDFPresetWindow.show();
    });

    ipcMain.on('hide-pdf-preset-window', function () {
      PDFPresetWindow.hide();
    });

    NewPDFPresetWindow.loadURL('file://' +__dirname +'/sections/visualisation/new-pdf-preset.html')
    ipcMain.on('new-pdf-preset-window', function (event, arg) {
      NewPDFPresetWindow.webContents.send('new-pdf-preset', arg); 
      NewPDFPresetWindow.show();
    });

    ipcMain.on('hide-new-pdf-preset-window', function () {
      NewPDFPresetWindow.hide();
    });

    PDFWindow.loadURL('file://' + __dirname + '/sections/visualisation/pdf-export.html');

    ipcMain.on('pdf-print-window', function (event, arg) {
      PDFWindow.webContents.send('pdf-data-print', arg); 
      PDFWindow.show();
    });

    ipcMain.on('hide-pdfwindow', function () {
      PDFWindow.hide();
    });

  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}



// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  if (process.mas) return;

  app.requestSingleInstanceLock();

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Require each JS file in the main-process dir
function loadDemos() {
  const files = glob.sync(path.join(__dirname, "main-process/**/*.js"));
  files.forEach(file => {
    require(file);
  });
}

initialize();


