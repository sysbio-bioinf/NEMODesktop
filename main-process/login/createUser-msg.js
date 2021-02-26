const {ipcMain} = require('electron')
const { dialog } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('addUserDupliTest', (event, args) => {
  var results = database.checkForUser(args);
  console.log("dupli:",results);
  if(results==null){
    event.sender.send('notDupliUser',0);//not a duplicate
  }else{
    const options = {
      type: 'info',
      title: 'Information',
      message: "Dieser Benutzername wird bereits genutzt. Bitte anderen Benutzernamen wählen.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("user creation: duplicate username")
  }
});

ipcMain.on('createUserPermi',(event,args)=>{
  if(args=="admin"){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Aktueller Benutzer hat nicht die Berechtigung, neuen Benutzer anzulegen. Bitte kontaktieren Sie einen Admin.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("user creation: no admin permission")
  } else if(args=="logged"){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Benutzer ist nicht eingeloggt.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)/
    console.log("user creation: user not logged in")
  } else if(args=="godmode"){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Möchten Sie wirklich einen neuen Admin-Benutzer anlegen?",
      buttons: ['Nein, abbrechen','Ja, Benutzer erstellen']
    };
    dialog.showMessageBox(options, (response) =>{
      if(response===0){
        console.log("user creation: new admin? "+false)
        event.sender.send('createUserGo',0)
      } else if(response==1){
        console.log("user creation: new admin? "+true)
        event.sender.send('createUserGo',1)
      }
    })
  } else if(args=="canceled"){
    const options = {
      type: 'info',
      title: 'Information',
      message: "Erstellung des Benutzers wurde abgebrochen.",
      buttons: ['Ok']
    };
    dialog.showMessageBox(options)
    console.log("user creation: Creation of admin user cancelled.")
  } else {
    console.log("Error...")
  }
})

ipcMain.on('addUser', (event, args) => {
  var results = database.addUserToDB(args);
  const options = {
    type: 'info',
    title: 'Information',
    message: "Neuer Benutzer wurde angelegt.",
    buttons: ['Ok']
  };   
  dialog.showMessageBox(options)
  console.log("user creation: new user was created");
});
