const {ipcMain} = require('electron')
const { dialog } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('changePassword-message',(event,args)=>{
  if(global.loggedUsername==""){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Sie sind nicht eingeloggt.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("change password: user not logged in")
  }else{
    var password
    var results = database.checkForUser(global.loggedUsername)
    password = results['password']
    event.sender.send('changePassword-gotPW',password)
  }
})

ipcMain.on('changePassword-passcheck', (event, args) => { 
 if(args==true){
    /*var results = checkForUser(global.loggedUsername)
    var sql = "SELECT * FROM users WHERE username = '" + global.loggedUsername + "'";
    var id = results['id'];
    var username = results['username'];
    var password = results['password'];
    var adm = results['admin'];
    var output = {id,username,password,adm};*/
        const options = {
          type: 'info',
          title: 'Information',
          message: "Möchten Sie wirklich ihr Passwort ändern?",
          buttons: ['Nein','Ja']
        }
        dialog.showMessageBox(options,(response)=>{
          if(response===0){
            const options = {
              type: 'info',
              title: 'Information',
              message: "Passwortänderung abgebrochen",
              buttons: ['Ok']
            };
            dialog.showMessageBox(options)
          }else if(response==1){
            event.sender.send('changePassword-reply',true);
          }
        })
    }else{
    const options = {
      type: 'info',
      title: 'Information',
      message: "Altes Passwort ist nicht korrekt",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("change password: old password not correct")
  }
})

ipcMain.on('fillInNewPassword',(event,args)=>{
  var results = database.checkForUser(global.loggedUsername)
  var id = results['id'];
  var username = results['username'];
  var password = args;
  var adm = results['admin'];
  var output = {id,username,password,adm};
  database.editUser(id,username,password,adm)
  const options = {
    type: 'info',
    title: 'Information',
    message: "Passwort erfolgreich geändert",
    buttons: ['Ok']
  };
  dialog.showMessageBox(options)
})

