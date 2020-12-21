var jsQR = require('jsqr');

var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");

var canvasdemo = document.getElementById("canvasdemo");
var ctx = canvasdemo.getContext("2d");

var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");
var fileSelector = document.getElementById("file-selector-demo");
var fileQrResult = document.getElementById("file-qr-result-demo");
var fs = require('fs');

function drawLine(begin, end, color) {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
  video.srcObject = stream;
  video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
  video.play();
  requestAnimationFrame(tick);
});

function tick() {
  loadingMessage.innerText = "⌛ Loading video..."
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;
    outputContainer.hidden = false;

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
      outputMessage.hidden = true;
      outputData.parentElement.hidden = false;
      outputData.innerText = code.data;
    } else {
      outputMessage.hidden = false;
      outputData.parentElement.hidden = true;
    }
  }
  requestAnimationFrame(tick);
}

function setResult(label, result) {
  label.textContent = result;
  label.style.color = "teal";
  clearTimeout(label.highlightTimeout);
  label.highlightTimeout = setTimeout(
    () => (label.style.color = "inherit"),
    100
  );
}

// ####### File Scanning #######
fileSelector.addEventListener("change", function (event) {
  const file = fileSelector.files[0];
  if (!file) {
    return;
  }
  console.log(file.path);

  // //read image (note: use async in production)
  // var _img = fs.readFileSync(file.path).toString('base64');
  // //example for .png
  // var _out = '<img src="data:image/png;base64,' + _img + '" />';
  // //render/display
  // var _target = document.getElementById('loaded-image');
  // _target.insertAdjacentHTML('beforeend', _out);

  var img = new Image();
  img.onload = function () {
    ctx.drawImage(img, 0, 0, 100, 100);
    canvasdemo.style.display = 'block';
  }
  img.src = file.path;
  var imgData = ctx.getImageData(0, 0, canvasdemo.width, canvasdemo.height);
  console.log(imgData);

  var code = jsQR(imgData.data, imgData.width, imgData.height, {
    inversionAttempts: "dontInvert"
  });
  console.log(code);

  if (code) {
    setResult(fileQrResult, code);
  } else {
    console.log('jsqr cannot read imagedata');
  }
});

