const {ipcRenderer} = require('electron')
const bcrypt = require('bcryptjs')
const remote = require('electron').remote
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const resetPasswordMsgBtn = document.getElementById('resetPassword-msg')
const unameX = document.getElementById('unameResetPassword')
const passwX = document.getElementById('passwResetPassword')

resetPasswordMsgBtn.addEventListener('click', () => {
  var loginSuccessful = remote.getGlobal('loginSuccessful')
  var adminLoggedIn = remote.getGlobal('adminLoggedIn')
  if(loginSuccessful==true){
    if(adminLoggedIn==true){
      var uname = unameX.value
      ipcRenderer.send('resetUserComparison',uname)
    } else {
      ipcRenderer.send('resetUserPermi',"admin")
      //document.getElementById('resetPassword-reply').innerHTML = "no admin permissions";
    }
  } else {
    ipcRenderer.send('resetUserPermi',"logged")
    //document.getElementById('resetPassword-reply').innerHTML = "you are not logged in";
  }

});

ipcRenderer.on('resetUserAllow',(event,args)=>{
  if(args==2){
    document.getElementById('unameResetPassword').value = "";
    document.getElementById('passwResetPassword').value = "";
  }else{
    var uname = unameX.value
    var passw = passwX.value
    var encryptedPassword = bcrypt.hashSync(passw, 10);
    var packet = {uname,encryptedPassword}
    ipcRenderer.send('resetPassword-message',packet);
    document.getElementById('unameResetPassword').value = "";
    document.getElementById('passwResetPassword').value = "";
}
})

/*ipcRenderer.on('resetResetFields',(event,args)=>{
  document.getElementById('unameResetPassword').value = "";
  document.getElementById('passwResetPassword').value = "";
})*/
