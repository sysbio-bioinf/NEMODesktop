const {ipcMain} = require('electron')
const { dialog } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('resetUserComparison',(event,args)=>{
  var results = database.checkForUser(args);
  let adm;
  if(results==null){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Keinen Benutzer mit diesem Namen gefunden",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
  }else{
    adm = results['admin'];
    if(adm==1){
      if(global.loggedUsername==args){
        event.sender.send('resetUserAllow',0);
      }else{
        const options = {
          type: 'info',
          title: 'Information',
          message: "Sie können nicht das Passwort eines Admin-Benutzers zurücksetzen.",
          buttons: ['Ok']
        };
        dialog.showMessageBox(options)
        console.log("password reset: admin reset denied")
        event.sender.send('resetResetFields',0);
      }        
    }else{
      event.sender.send('resetUserAllow',1);
    }
  }

  /*var sql = "SELECT admin FROM users WHERE username = '" + args + "'";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    if(result.length==0){
      const options = {
        type: 'info',
        title: 'Information',
        message: "No user with this name found",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options)
      console.log("delete user: username not known")
    }else{
      adm = result[0].admin;
      if(adm==1){
        if(global.loggedUsername==args){
          event.sender.send('resetUserAllow',0);
        }else{
          const options = {
            type: 'info',
            title: 'Information',
            message: "You cannot reset another admins password.",
            buttons: ['Ok']
          };
          dialog.showMessageBox(options)
          console.log("password reset: admin reset denied")
          event.sender.send('resetUserAllow',2);
        }        
      }else{
        event.sender.send('resetUserAllow',1);
      }
    }
  });*/
})

ipcMain.on('resetPassword-message', (event, args) => {
  var uname = args.uname;
  var passw = args.encryptedPassword;
  var results = database.checkForUser(uname);
  var id = results['id'];
  var adm = results['admin'];
  database.editUser(id,uname,passw,adm)
  const options = {
    type: 'info',
    title: 'Information',
    message: "Passwort wurde zurückgesetzt",
    buttons: ['Ok']
  };
  dialog.showMessageBox(options)
});

ipcMain.on('resetUserPermi',(event,args)=>{
  if(args=="admin"){
    const options = {
        type: 'info',
        title: 'Information',
        message: "Dieser Benutzer hat nicht die Befugnis, Passwörter zurückzusetzen. Bitte kontaktieren Sie einen Admin.",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options).then(index => {
        //console.log("password reset: no admin permission")
      })
      console.log("password reset: no admin permission")
  }else if(args=="logged"){
    const options = {
        type: 'info',
        title: 'Information',
        message: "Sie sind nicht eingeloggt.",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options).then(index => {
        //console.log("password reset: not logged in")
      })
      console.log("password reset: not logged in")
  }
})
