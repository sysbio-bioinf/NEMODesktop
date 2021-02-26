const {ipcRenderer} = require('electron')

const logoutMsgBtn = document.getElementById('logout-msg')

logoutMsgBtn.addEventListener('click', () => {
  ipcRenderer.send('logout-message', true)
    document.getElementById('loginOnly').setAttribute("style","height:auto");
    document.getElementById('loginOnly').style.visibility = "visible";
})
/*
ipcRenderer.on('logout-reply',(event,args)=>{
  document.getElementById('logout-reply').innerHTML = args
})
*/
