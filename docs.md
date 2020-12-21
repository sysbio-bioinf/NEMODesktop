# Documentation

## Folder Structure

#### `assets`

#### `main-process`

#### `renderer-process`

#### `sections`

#### `index.html`

#### `main.js`

#### `package.json`

#### Docs

The files: `CODE_OF_CONDUCT`, `README`, `docs` and `CONTRIBUTING` files make up the documentation for the project.

## UI Terminology

## CSS Naming Convention

## Add a Section

### New Section

#### index.html

This page contains the sidebar list of sections as well as each section template that is imported with HTML imports.

- Add demo to sidebar in the appropriate category in `index.html`
- update `id` i.e. `id="button-dialogs"`
- update `data-section` i.e. `data-section="dialogs"`
- Add demo template path to the import links in the `head` of `index.html`
- i.e. `<link rel="import" href="sections/native-ui/dialogs.html">`

#### Template

This template is added to the `index.html` in the app.

- In the `sections` directory, copy an existing template `html` file from the category you're adding a section to.
- Update these tags `id`
- i.e. `id="dialogs-section"`
- Update all the text in the `header` tag with text relevant to your new section.
- Remove the demos and pro-tips as needed.

### Demo

Any code that you create for your demo should be added to the 'main-process' or 'renderer-process' directories depending on where it runs.

All JavaScript files within the 'main-process' directory are run when the app starts but you'll link to the file so that it is displayed within your demo (see below).

The renderer process code you add will be read and displayed within the demo and then required on the template page so that it runs in that process (see below).

- Start by copying and pasting an existing `<div class="demo">` blocks from the template page.
- Update the demo button `id`
- i.e `<button class="demo-button" id="information-dialog">View Demo</button>`
- If demo includes a response written to the DOM, update that `id`, otherwise delete:
- i.e. `<span class="demo-response" id="info-selection"></span>`
- Update the text describing your demo.
- If you are displaying main or renderer process sample code, include or remove that markup accordingly.
- Sample code is read and added to the DOM by adding the path to the code in the `data-path`
  - i.e. `<pre><code data-path="renderer-process/native-ui/dialogs/information.js"></pre></code>`
- Require your render process code in the script tag at the bottom of the template
  - i.e `require('./renderer-process/native-ui/dialogs/information')`

#### Try it out

At this point you should be able to run the app, `npm start`, and see your section and/or demo. :tada:
