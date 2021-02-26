const {ipcRenderer} = require('electron')
const bcrypt = require('bcryptjs')
const remote = require('electron').remote
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const deleteUserMsgBtn = document.getElementById('deleteUser-msg')
const unameX = document.getElementById('unameDeleteUser')

deleteUserMsgBtn.addEventListener('click', () => {
  var loginSuccessful = remote.getGlobal('loginSuccessful')
  var adminLoggedIn = remote.getGlobal('adminLoggedIn')
  if(loginSuccessful==true){
    if(adminLoggedIn==true){
      var uname = unameX.value
      ipcRenderer.send('deleteUserComparison',uname)
    } else {
      ipcRenderer.send('deleteUserPermi',"admin")
      //document.getElementById('deleteUser-reply').innerHTML = "no admin permissions";
    }
  } else {
    ipcRenderer.send('deleteUserPermi',"logged")
    //document.getElementById('deleteUser-reply').innerHTML = "you are not logged in";
  }

});

ipcRenderer.on('deleteUserAllow',(event,args)=>{
  var selfdelete
  if(args==0){
    selfdelete = true
  } else {
    selfdelete = false
  }
  var uname = unameX.value
  //let message = "Resetting password for username "+uname
  //document.getElementById('deleteUser-reply').innerHTML = message
  //var sql = "DELETE FROM users WHERE username = '"+uname+"'"
  //document.getElementById('deleteUser-reply').innerHTML = sql
  var packet = {uname,selfdelete}
  ipcRenderer.send('deleteUser-message',packet);
  document.getElementById('unameDeleteUser').value = "";
})

ipcRenderer.on('returnMeToLogin',(event,args)=>{
  document.getElementById('loginscreen-section').classList.add('is-selected')
  document.getElementById('loginscreen-section').classList.add('is-shown')
  document.getElementById('loginOnly').style.visibility = "visible";
  document.getElementById('generalUser').style.visibility = "hidden";
  document.getElementById('adminUser').style.visibility = "hidden";
})

ipcRenderer.on('resetDeleteUserFields',(event,args)=>{
  document.getElementById('unameDeleteUser').value = "";
})
