const {ipcMain} = require('electron')
const { dialog } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('login-message', (event, args) => { 
  var results = database.checkForUser(args);
  if(results==null){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Keinen Benutzer mit diesem Namen gefunden",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("login: username not known")
  }else{
    var username = results['username']
    var password = results['password']
    var adm = results['admin']
    var output = {username,password,adm}
    event.sender.send('login-reply',output);
  }
})
