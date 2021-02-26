const {ipcMain} = require('electron')
const { dialog } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('deleteUserPermi',(event,args)=>{
  if(args=="admin"){
    const options = {
        type: 'info',
        title: 'Information',
        message: "Dieser Benutzer hat nicht die Berechtigung, einen Benutzer zu löschen. Bitte kontaktieren Sie einen Admin.",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options)
      console.log("delete user: no admin permission")
  }else if(args=="logged"){
    const options = {
        type: 'info',
        title: 'Information',
        message: "Sie sind nicht eingeloggt.",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options).
      console.log("delete user: not logged in")
  }
})

ipcMain.on('deleteUserComparison',(event,args)=>{
  console.log(args)
  var results = database.checkForUser(args);
  let adm;
  if(results==null){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Kein Benutzer mit diesem Namen gefunden.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("delete user: username not known")
    event.sender.send('resetDeleteUserFields',0)
  }else{
    adm = results['admin'];
    if(adm==1){
      if(global.loggedUsername==args){
        event.sender.send('deleteUserAllow',0);
      }else{
        const options = {
          type: 'info',
          title: 'Information',
          message: "Sie können nicht einen anderen Admin-Benutzer löschen.",
          buttons: ['Ok']
        };
        dialog.showMessageBox(options)
        console.log("delete user: admin delete denied")
        event.sender.send('resetDeleteUserFields',0)
      }        
    }else{
      event.sender.send('deleteUserAllow',1);
    }
  }
})

ipcMain.on('deleteUser-message', (event, args) => {
  const lastoptions = {
    type: 'info',
    title: 'Information',
    message: "Möchten Sie diesen Benutzer wirklich löschen?",
    buttons: ['Nein', 'Ja']
  }
  dialog.showMessageBox(lastoptions, (response) =>{
    if(response===0){
      const options = {
        type: 'info',
        title: 'Information',
        message: "Benutzerlöschung abgebrochen",
        buttons: ['Ok']
      };
      dialog.showMessageBox(options)
    }else if(response==1){
      var selfdelete = args.selfdelete
      var uname = args.uname
      console.log(args)
      /*console.log(selfdelete +"/"+ sql)
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("delete user: 1 user deleted");
      });*/
      if(selfdelete==true){
        var resAd = database.checkLastUserAdmin();
        var resUs = database.checkLastUser();
        if(resAd==1){//only one admin user left
          if(resUs>1){//but other non-admin users left
            const options = {
              type: 'info',
              title: 'Information',
              message: "Kann letzten Admin-Benutzer nicht löschen.",
              buttons: ['Ok']
            };
            dialog.showMessageBox(options)
          }else{//and no other non-admin users left
            database.deleteUserFromDB(uname)
            global.loginSuccessful = false;
            global.adminLoggedIn = false;
            global.loggedUsername = "";
            const options = {
              type: 'info',
              title: 'Information',
              message: "Ihr Account wurde gelöscht und Sie werden ausgeloggt.",
              buttons: ['Ok']
            };
            dialog.showMessageBox(options)
            console.log("last user was deleted. return to initial")
            event.sender.send('firstUser2',0);
          }
        }else{//more than one admin user left
          database.deleteUserFromDB(uname)
          global.loginSuccessful = false;
          global.adminLoggedIn = false;
          global.loggedUsername = "";
          const options = {
            type: 'info',
            title: 'Information',
            message: "Ihr Account wurde gelöscht und Sie werden ausgeloggt.",
            buttons: ['Ok']
          };
          dialog.showMessageBox(options)
          event.sender.send('returnMeToLogin',0)
        }
      }else{//meaning:selfdelete==false
        database.deleteUserFromDB(uname)
        const options = {
          type: 'info',
          title: 'Information',
          message: "Benutzer wurde gelöscht",
          buttons: ['Ok']
        };
        dialog.showMessageBox(options)
      }
    }
  })
});

