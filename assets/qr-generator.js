'use strict'

let textarea = document.getElementById('textarea');
let img = document.getElementById('img-qr');

// Preview QR code at text change
textarea.addEventListener('keyup', e => {
  let text = textarea.value;

  createQRPNGBase64(text)
    .then(dataUri => img.src = dataUri);

});

const qr = require('qr-image');
const fs = require('fs');

/**
 * Create QR image to file
 */
function createQR(text, type, filename) {
  qr.image(text, {
    ec_level: 'L',
    type: type,
    margin: 5,
    size: 10
  }).pipe(fs.createWriteStream(filename));
}

/**
 * Create QR image data in data URI.
 */
function createQRPNGBase64(text) {
  return new Promise((resolve, reject) => {

    let buffers = [];

    qr.image(text, {
      format: 'svg'
    })
      .on('data', buffer => buffers.push(buffer))
      .on('end', _ => {

        let buffer = Buffer.concat(buffers);
        let dataUri = `data:image/svg;base64,${buffer.toString('base64')}`;
        resolve(dataUri);
      })
      .on('error', reject);
  });
}

/**
 * Save dialog
 */

const { dialog } = require('electron').remote;

function save() {

  let text = textarea.value;
  let filename = dialog.showSaveDialog({
    title: 'Save',
    defaultPath: text,
    filters: [
      { name: 'Portable Network Graphics', extensions: ['png'] },
      { name: 'Scalable Vector Graphics', extensions: ['svg'] },
      { name: 'Encapsulated PostScript', extensions: ['eps'] },
      { name: 'Portable Document Format', extensions: ['pdf'] }
    ]
  });

  // canceled
  if (!filename) return;

  let type = getType(filename);

  // Save QR to file
  createQR(text, type, filename);
}

/**
 * Determine type from filename extension.
 */
function getType(filename) {

  if (/\.png$/.test(filename)) {
    return 'png';
  } else if (/\.svg$/.test(filename)) {
    return 'svg';
  } else if (/\.eps$/.test(filename)) {
    return 'eps';
  } else if (/\.pdf$/.test(filename)) {
    return 'pdf';
  }

  // Default is png
  return 'png';
}

// /**
//  * Menu
//  */

// const { Menu, MenuItem } = require('electron').remote;

// // Create menu
// let template = [
//   {
//     label: 'File',
//     submenu: [
//       {
//         label: 'Save',
//         accelerator: 'Ctrl+S',
//         click(item, focusedWindow) {
//           save();
//         }
//       }, {
//         label: 'Exit',
//         accelerator: 'Ctrl+Q',
//         click(item, focusedWindow) {
//           window.close();
//         }
//       }
//     ]
//   }
// ];

// Set menu
// const menu = Menu.buildFromTemplate(template);
// Menu.setApplicationMenu(menu);