const settings = require('electron-settings')
const remote = require('electron').remote
const { ipcRenderer } = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../database"));

document.getElementById('loginOnly').style.visibility = "visible";
document.getElementById('loginOnly').setAttribute("style","height:auto");
document.getElementById('generalUser').style.visibility = "hidden";
document.getElementById('adminUser').style.visibility = "hidden";
document.getElementById('loginscreen-section').classList.add('is-selected')
document.getElementById('loginscreen-section').classList.add('is-shown')

document.body.addEventListener('click', (event) => {
  //ipcRenderer.send('consoleLogger',event.target.id)
  //timer for timeout goes here?
  if(event.target.id=="button-about"){
    displayAbout()
  }else if(event.target.id=="impressum"){
    displayImpressum()
  }else if(event.target.id=="datenschutz"){
    displayDatenschutz()
  }else if(event.target.id=="get-started"){
    hideAllModals()
  }else if(remote.getGlobal('loginSuccessful')==false){
    hideAllSectionsAndDeselectButtons()
    document.getElementById('loginscreen-section').classList.add('is-selected')
    document.getElementById('loginscreen-section').classList.add('is-shown')
    //document.getElementById('login-demo-toggle').classList.add('is-shown')
    //ipcRenderer.send('loginChecker',0)
  }else{
    if(event.target.id=="button-logout"){
      ipcRenderer.send('logout-message', true)
      hideAllSectionsAndDeselectButtons()
      document.getElementById('loginscreen-section').classList.add('is-selected')
      document.getElementById('loginscreen-section').classList.add('is-shown')
      document.getElementById('loginOnly').setAttribute("style","height:auto");
      document.getElementById('loginOnly').style.visibility = "visible";
      document.getElementById('generalUser').style.visibility = "hidden";
      document.getElementById('adminUser').style.visibility = "hidden";
    }else{
      if (event.target.dataset.section) {
        handleSectionTrigger(event)
      } else if (event.target.dataset.modal) {
        handleModalTrigger(event)
      } else if (event.target.classList.contains('modal-hide')) {
        hideAllModals()
      }
    }
  }
})

function handleSectionTrigger(event) {
  hideAllSectionsAndDeselectButtons()

  // Highlight clicked button and show view
  event.target.classList.add('is-selected')

  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`
  document.getElementById(sectionId).classList.add('is-shown')

  // Save currently active button in localStorage
  //const buttonId = event.target.getAttribute('id')
  //settings.set('activeSectionButtonId', buttonId)
  settings.set('activeSectionButtonId', 'button-loginscreen')//default to login
  //settings.set('activeDemoButtonId','login-demo-toggle')
}

function activateDefaultSection() {
  document.getElementById('button-windows').click()
}

function showMainContent() {
  document.querySelector('.js-nav').classList.add('is-shown')
  document.querySelector('.js-content').classList.add('is-shown')
}

function handleModalTrigger(event) {
  hideAllModals()
  const modalId = `${event.target.dataset.modal}-modal`
  document.getElementById(modalId).classList.add('is-shown')
}

function hideAllModals() {
  const modals = document.querySelectorAll('.modal.is-shown')
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove('is-shown')
  })
  showMainContent()
}

function hideAllSectionsAndDeselectButtons() {
  const sections = document.querySelectorAll('.js-section.is-shown')
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove('is-shown')
  })

  const buttons = document.querySelectorAll('.nav-button.is-selected')
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove('is-selected')
  })
}

function displayAbout() {
  document.querySelector('#about-modal').classList.add('is-shown')
}

function displayImpressum() {
  hideAllSectionsAndDeselectButtons()
  document.getElementById('impressum-section').classList.add('is-selected')
  document.getElementById('impressum-section').classList.add('is-shown')
}

function displayDatenschutz() {
  hideAllSectionsAndDeselectButtons()
  document.getElementById('datenschutz-section').classList.add('is-selected')
  document.getElementById('datenschutz-section').classList.add('is-shown')
}

function displayFirstUser() {
  document.querySelector('#firstUser-modal').classList.add('is-shown')
}

ipcRenderer.on('firstUser2',(event,args) => {
  if(args==1){
    document.querySelector('.js-nav').classList.add('is-shown')
    document.querySelector('.js-content').classList.add('is-shown')
    document.getElementById('loginscreen-section').classList.add('is-shown')
    //document.getElementById('login-demo-toggle').classList.add('is-shown')
  }else{
    //document.querySelector('.js-nav').classList.add('is-shown')
    document.querySelector('.js-content').classList.add('is-shown')
    displayFirstUser()
  }
})

const firstUser = document.getElementById('firstUser')
const bcrypt = require('bcryptjs')

firstUser.addEventListener('click', () => {
  const unameX = document.getElementById('unameFirstUser')
  const passwX = document.getElementById('passwFirstUser')
  let uname = unameX.value
  let passw = passwX.value
  let encryptedPassword = bcrypt.hashSync(passw, 10);
  var new_user = {id:database.generateUserID(),
     username:uname,
     password:encryptedPassword,
     admin:1};
  ipcRenderer.send('addFirstUser',new_user)
})

ipcRenderer.on('firstUserCreated',(event,args)=>{
  ipcRenderer.send('loginSucc',args)
  document.getElementById('loginOnly').setAttribute("style","height:0px");
  document.getElementById('loginOnly').style.visibility = "hidden";
  document.getElementById('generalUser').style.visibility = "visible";
  document.getElementById('adminUser').style.visibility = "visible";
  //document.getElementById('loginscreen-section').classList.add('is-shown')
  //document.getElementById('login-demo-toggle').classList.add('is-shown')
})

// Default to the view that was active the last time the app was open
const sectionId = false//settings.get('activeSectionButtonId')
if (sectionId) {
  showMainContent()
  const section = document.getElementById(sectionId)
  if (section) section.click()
} else {
  ipcRenderer.send('firstUsers',0)
  //activateDefaultSection()
  //displayAbout()
}
