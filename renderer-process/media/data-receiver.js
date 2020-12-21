
const { ipcRenderer } = require('electron');


var select = document.getElementById("camSelect"); 

Camera.getCameras()
    .then(function (cameras) {
        if (cameras.length > 0) {
            var camValue = document.getElementById("camValue"); 
            select.removeChild(camValue);
            for (var i = 0; i < cameras.length; i++) {
                var camName = cameras[i].name;
                var el = document.createElement("option");
                el.textContent = camName;
                el.value = camName;
                select.appendChild(el);
            }
            
        } else {
            console.error("No cameras found.");
        }
    })
    .catch(function (e) {
        console.error(e);
    });

const button_readQRCode = document.getElementById("button-readQRCode");
button_readQRCode.addEventListener('click', () => {
    var arg = select.selectedIndex;
    ipcRenderer.send('start-qrcode-reader',arg);
})
