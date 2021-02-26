const {ipcRenderer} = require('electron')
const bcrypt = require('bcryptjs')
const remote = require('electron').remote
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const loginMsgBtn = document.getElementById('login-msg')
const unameX = document.getElementById('unameLogin')
const passwX = document.getElementById('passwLogin')

loginMsgBtn.addEventListener('click', () => {
  let uname = unameX.value
  ipcRenderer.send('login-message', uname)
})

ipcRenderer.on('login-reply', (event, args) => {
  let adm = args.adm;
  let encry = args.password;
  let passw = passwX.value;
  let uname = unameX.value;
  var passcheck = bcrypt.compareSync(passw, encry);
  var sendback = {passcheck,uname,adm};
  ipcRenderer.send('loginSucc',sendback)
  document.getElementById('unameLogin').value = "";
  document.getElementById('passwLogin').value = "";
  if (passcheck) {
    //document.getElementById('login-demo-toggle').style.visibility = "hidden";
    //document.getElementById('login-demo-toggle').classList.toggle('is-selected')
    //document.getElementById('loginOnly').style.display = "none";
    document.getElementById('loginOnly').setAttribute("style","height:0px");
    document.getElementById('loginOnly').style.visibility = "hidden";
    document.getElementById('generalUser').style.visibility = "visible";
    if(adm==1){
      document.getElementById('adminUser').style.visibility = "visible";
    }
  }else{
    document.getElementById('loginOnly').setAttribute("style","height:auto");
    document.getElementById('loginOnly').style.visibility = "visible";
    document.getElementById('generalUser').style.visibility = "hidden";
    document.getElementById('adminUser').style.visibility = "hidden";
  } 
})
