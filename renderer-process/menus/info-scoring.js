const {ipcRenderer} = require('electron')

// Tell main process to show the menu when demo button is clicked

const cancel_info_scoring_button = document.getElementById("info-scoring_cancel");
cancel_info_scoring_button.addEventListener('click', () => {
    ipcRenderer.send('hide-info-scoring');
})  


