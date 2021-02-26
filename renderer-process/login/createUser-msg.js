const {ipcRenderer} = require('electron')
const bcrypt = require('bcryptjs')
const remote = require('electron').remote
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));


const createUserMsgBtn = document.getElementById('createUser-msg')
const unameX = document.getElementById('unameCreateUser')
const passwX = document.getElementById('passwCreateUser')

logAdmin = document.getElementById('logAdmin')
var admincheck = 0;
logAdmin.addEventListener('click', () =>{
 if(admincheck == 0){
   admincheck = 1;
 } else {
   admincheck = 0;
 }
});

createUserMsgBtn.addEventListener('click', () => {
  var loginSuccessful = remote.getGlobal('loginSuccessful')
  var adminLoggedIn = remote.getGlobal('adminLoggedIn')
  var uname = unameX.value
  if(loginSuccessful==true){
    if(adminLoggedIn==true){
      //let message = "Creating user for username "+uname
      //document.getElementById('createUser-reply').innerHTML = message
      ipcRenderer.send('addUserDupliTest',uname);
    } else {
      ipcRenderer.send('createUserPermi',"admin")
      document.getElementById('unameCreateUser').value = "";
      document.getElementById('passwCreateUser').value = "";
      //document.getElementById('createUser-reply').innerHTML = "no admin permissions";
    }
  } else { 
    ipcRenderer.send('createUserPermi',"logged")
    document.getElementById('unameCreateUser').value = "";
    document.getElementById('passwCreateUser').value = "";
    //document.getElementById('createUser-reply').innerHTML = "you are not logged in";
  }
});

ipcRenderer.on('notDupliUser',(event,args) => {
  if(args==0){
    let adm = admincheck
    if(adm==1){
    ipcRenderer.send('createUserPermi',"godmode")
  }else {
    let uname = unameX.value
    let passw = passwX.value
    let adm = admincheck
    let encryptedPassword = bcrypt.hashSync(passw, 10);
    var new_user = {id:database.generateUserID(),
       username:uname,
       password:encryptedPassword,
       admin:adm};
    //database.addUserToDB(new_user);
    ipcRenderer.send('addUser',new_user)
    document.getElementById('unameCreateUser').value = "";
    document.getElementById('passwCreateUser').value = "";
  }
   //message = "User "+uname+" was created"
   //document.getElementById('createUser-reply').innerHTML = message;
 //} else if (args==1) {
 //  document.getElementById('createUser-reply').innerHTML = "Username already in use";
  }else {
    document.getElementById('unameCreateUser').value = "";
    document.getElementById('passwCreateUser').value = "";
  }
})

ipcRenderer.on('createUserGo',(event,args)=>{
  if(args==1){
    let uname = unameX.value
    let passw = passwX.value
    let adm = admincheck
    let encryptedPassword = bcrypt.hashSync(passw, 10);
    var new_user = {id:database.generateUserID(),
       username:uname,
       password:encryptedPassword,
       admin:adm};
    //database.addUserToDB(new_user);
    ipcRenderer.send('addUser',new_user)
    document.getElementById('unameCreateUser').value = "";
    document.getElementById('passwCreateUser').value = "";
    document.getElementById('logAdmin').checked = 0;
    admincheck = 0;
  }else if(args==0){
    ipcRenderer.send('createUserPermi',"canceled")
    document.getElementById('unameCreateUser').value = "";
    document.getElementById('passwCreateUser').value = "";
    document.getElementById('logAdmin').checked = 0;
    admincheck = 0;
  }
})
