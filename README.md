## Using
```bash
# Installation with Ubuntu computer to run the desktop application:
$ sudo apt-get install nodejs
$ sudo apt-get install npm
$ npm install electron --save-dev

## Building

```bash
$ git clone project-repository
$ cd project-folder
# create package.json if necessary
$ ./create_PackageJson.sh 
# otherwise run
$ npm install
# run electron-rebuild
./node_modules/.bin/electron-rebuild
# start electron
$ npm start
# For easier developing you can launch the app in fullscreen with DevTools open:
$ npm run dev
```

## Extending

## Translations
