# npm init --force
# add/modify
# "scripts": {
#     "start": "electron ."
#
# taken from project
# electron-webpack-quick-start
#
echo '{
  "name": "medapp",
  "keywords": [],
  "author": "",
  "version": "1.0.0",
  "license": "ISC",
  "main": "main.js",
  "directories": {
     "test": "test"
  },
  "scripts": {
    "dev": "electron-webpack dev",
    "compile": "electron-webpack",
    "dist": "yarn compile && electron-builder",
    "dist:dir": "yarn dist --dir -c.compression=store -c.mac.identity=null",
    "start": "electron ."
  },
  "dependencies": {
    "source-map-support": "^0.5.12"
  },
  "devDependencies": {
    "electron": "5.0.6",
    "electron-builder": "^21.0.11",
    "electron-webpack": "^2.7.4",
    "webpack": "~4.35.3"
  }
}' > package.json
#
npm install --save electron
#
npm install --save glob
npm install --save lokijs
npm install  font-awesome --save
#
npm install  chart.js@2.9.3 --save
npm install chartjs-plugin-zoom --save
#
npm install electron-context-menu
#
npm install electron-settings --save
#
npm i csv-writer
npm install iconv-lite
npm install usb
npm install uvc-control
npm install soap
# optional
npm install electron-shortcut-normalizer --save
npm install highlight.js --save
# 
# npm install instascan --save
# version 1.0.0 is not compatible with electron ^5.0.8  
npm install instascan@2.0.0-rc.4 --save
# version 2.0.0* https://github.com/schmich/instascan
# instascan.min not available for 2.0.0-rc.4
# instead access from assets folder
# src/scanner.js, camera.js, zhing.js
# and install dependencies
# npm install babel-polyfill --save
npm install  fsm-as-promised  --save
npm install  visibilityjs  --save
npm install  webrtc-adapter  --save

npm install --save-dev electron-rebuild
#
#
# Infos on how to build Build configuration
# https://www.electron.build
# https://www.electron.build/configuration/configuration
#
# sample file
#
# {
#   "name": "medapp",
#   "keywords": [],
#   "author": "",
#   "version": "1.0.0",
#   "license": "ISC",
#   "main": "main.js",
#   "directories": {
#     "test": "test"
#   },
#   "scripts": {
#     "dev": "electron-webpack dev",
#     "compile": "electron-webpack",
#     "dist": "yarn compile && electron-builder",
#     "dist:dir": "yarn dist --dir -c.compression=store -c.mac.identity=null",
#     "start": "electron ."
#   },
#   "dependencies": {
#     "chart.js": "^2.8.0",
#     "chartjs-plugin-zoom": "^0.7.3",
#     "csv-writer": "^1.5.0",
#     "electron-shortcut-normalizer": "^1.0.0",
#     "electron-settings": "^3.2.0",
#     "font-awesome": "^4.7.0",
#     "glob": "^7.1.4",
#     "highlight.js": "^9.15.8",
#     "lokijs": "^1.5.7",
#     "source-map-support": "^0.5.12",
#     "update-electron-app": "^1.1.1",
#     "fsm-as-promised": "^0.13.0",
#     "visibilityjs": "^1.2.3",
#     "webrtc-adapter": "^1.4.0"
#   },
#   "devDependencies": {
#     "electron": "^5.0.8",
#     "electron-builder": "^21.0.11",
#     "electron-webpack": "^2.7.4",
#     "webpack": "~4.35.3"
#   }
# }
