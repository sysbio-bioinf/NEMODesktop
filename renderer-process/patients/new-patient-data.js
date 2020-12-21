//The following functions are used to handle the data corresponding to the patients save in JSON files.
//-----------------------------------------------------------------------------------------------------
const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const database = require(path.resolve("./database"));
const loki = require("lokijs");

const form_cancel_button = document.getElementById("btn_cancel");
form_cancel_button.addEventListener("click", (event) => {
  ipcRenderer.send('hide-window');
});

ipcRenderer.on('update-id', (event,arg) => {
  var id = document.getElementById("pid");
  id.value = arg.id
  var fname = document.getElementById("fname");
  fname.value = arg.fname;
  var lname = document.getElementById("lname");
  lname.value = arg.lname;
  var bdate = document.getElementById("bdate");
  bdate.value = arg.bdate;
});

const form_submit_button = document.getElementById("btn_submit");
const path2safe = "./patients/";
form_submit_button.addEventListener("click", () => {

  var pid = document.getElementById('pid').value
  var fname = document.getElementById('fname').value;
  var lname = document.getElementById('lname').value;
  var today = new Date();
  var input_date = document.getElementById('input-date').value;
  var current = new Date(input_date);

  var year = current.getFullYear();
  var month = current.getMonth() + 1;
  var day = current.getDate(); 
  var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
  var general = document.getElementById('wellness').value; //0,1,2,3;//0,1,2,3
  var dia = document.getElementById('diarrhoe').value; //0,1,2,3
  var eat = document.getElementById('uebelkeit').value; //0,1,2,3
  var pain = document.getElementById('schmerzen').value; //0,1,2,3
  var oral = document.getElementById('mukositis').value; //0,1,2,3
  var appetite = document.getElementById('erbrechen').value; //0,1,2,3
  var activity = document.getElementById('sport').value; //0,1
  var weight = document.getElementById('gewicht').value; //weight
  var comments = document.getElementById('comments').value;; //text
  var input_date = new Date(year + '-' + month + '-' + day + ' ' + time);

  
  var new_entry = {
                  pid: pid,
                  idate: input_date,
                  year: year,
                  month: month,
                  day: day,
                  time: time,
                  general: general,
                  dia: dia,
                  eat: eat,
                  pain: pain,
                  oral: oral,
                  appetite: appetite,
                  activity: activity,
                  weight: weight,
                  comments: comments
                  };

    console.log("New Data: " + new_entry);

    database.addEntry(new_entry);

    ttt = database.readEntries(pid, fname, lname);
  
  ipcRenderer.send('hide-window');
})


//-----------------------------------------------------------------------------------------------------
