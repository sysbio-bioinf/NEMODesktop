const {ipcRenderer} = require('electron')
const bcrypt = require('bcryptjs')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const changePasswordMsgBtn = document.getElementById('changePassword-msg')
//const unameX = document.getElementById('unameChangePassword')
const passwX = document.getElementById('passwChangePassword')
const newpasswX = document.getElementById('newpasswChangePassword')

changePasswordMsgBtn.addEventListener('click', () => {
  ipcRenderer.send('changePassword-message', true)
})

ipcRenderer.on('changePassword-gotPW',(event,args)=>{
  let passw = passwX.value;
  let encry = args;
  var passcheck = bcrypt.compareSync(passw, encry);
  ipcRenderer.send('changePassword-passcheck',passcheck)
})

ipcRenderer.on('changePassword-reply', (event, args) => {
  let newpassw = newpasswX.value
  let encryptedPassword = bcrypt.hashSync(newpassw, 10);
  ipcRenderer.send('fillInNewPassword',encryptedPassword)
  document.getElementById('passwChangePassword').value = "";
  document.getElementById('newpasswChangePassword').value = "";
})

