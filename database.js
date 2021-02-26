"use strict";

const loki = require("lokijs");
const {ipcRenderer} = require("electron");
const path = require("path");
var users;
var patients;
var entries;
var medications;
var visits;
var medicationUpdates;
var pdfPresets;
var devices; //UUIDs
var status = false;

const electron = require('electron');

const configDir =  (electron.app || electron.remote.app).getPath('userData');
console.log(configDir);

const db_path = path.join(configDir,"patientdata.db");

const db = new loki(db_path, {
	autoload: true,
	autoloadCallback: databaseInit,
	autosave: true, 
	autosaveInterval: 2000
});

//callback method for patient database
function databaseInit() {

    console.log("database initialization ...");

    users = db.getCollection("users");
    if (users === null) {
      patients = db.addCollection("users");
    }

    patients = db.getCollection("patients");
    if (patients === null) {
      patients = db.addCollection("patients");
    }

    entries = db.getCollection("entries");
    if (entries === null) {
      entries = db.addCollection("entries");
    }

    medications = db.getCollection("medications");
    if (medications === null){
      medications = db.addCollection("medications");
    }

    visits = db.getCollection("visits");
    if (visits === null){
      visits = db.addCollection("visits");
    }

    medicationUpdates = db.getCollection("medicationUpdates");
    if (medicationUpdates === null){
      medicationUpdates = db.addCollection("medicationUpdates");
    }

    pdfPresets = db.getCollection("pdfPresets");
    if(pdfPresets == null) {
      pdfPresets = db.addCollection("pdfPresets");
    }

    devices = db.getCollection("devices");
    if(devices == null) {
      devices = db.addCollection("devices");
    }

    db.on("loaded", () => {
      status = true;
      console.log('Im here with the status: ' + status);
    });

    //entry_view = entries.addDynamicView("new_entry");

    console.log("... initialization done!");

}

// user management

function addUserToDB(new_user) {
  return(new Promise(function(resolve, reject){
    console.log("Adding user to db ...");
    //console.log(users);
    users.insert(new_user);
    db.saveDatabase();
    console.log(new_user['username']," successfully added to db");
    resolve("...user successfully added to db");
  })
  );
}

function checkForUser(user) {
  console.log("checking for user ...");
  console.log(user);
  console.log(users)
  var results = users.findOne({'username': user});
  return(results);
}

function generateUserID(){
  var user_id;
  users = db.getCollection("users");
  try{
    if (users === null){
      user_id = 1;
    }else{
      user_id = Math.max(users.idIndex)+1
    }
    console.log("Generated user ID: " + user_id.toString());
    return user_id.toString();
  }catch(error){
    console.log("An error occcured and the user could not be successfully created!");
    console.log(error.message);
  }
}

function deleteUserFromDB(user){
  console.log("deleting user ",user);
  users.findAndRemove({'username': user});
  db.saveDatabase();
  console.log(user," was deleted");
}

function checkLastUser(){
  return(new Promise(function(resolve, reject){
    users = db.getCollection("users");
    resolve(users.data.length);
  })
  );
  //users = db.getCollection("users");
  //return(users.data.length);
}

function checkLastUserAdmin(){
  users = db.getCollection("users");
  var admExist = users.find({ admin: {'$gte': 1} });
  return(admExist.length)
}

function editUser(id, username, password, admin) {
  users = db.getCollection("users");
  var tmp = users.findOne({'username': username});
  console.log('tmp: ' + tmp.username);
  tmp.id = id;
  tmp.username = username;
  tmp.password = password;
  tmp.admin = admin;
  users.update(tmp);
  db.saveDatabase();
}

function readAllUsers(){
  if (db.getCollection("users") != null) {
    return db.getCollection("users").chain().simplesort('username',false).data();
  }else{
    return null;
  }
}

module.exports.addUserToDB = addUserToDB;
module.exports.checkForUser = checkForUser;
module.exports.generateUserID = generateUserID;
module.exports.deleteUserFromDB = deleteUserFromDB;
module.exports.checkLastUser = checkLastUser;
module.exports.checkLastUserAdmin = checkLastUserAdmin;
module.exports.editUser = editUser;
module.exports.readAllUsers = readAllUsers;

// patient management

function addPatientToDB(new_patient) {
  return(new Promise(function(resolve, reject){
    console.log("Adding patient to db ...");
    console.log(patients);
    patients.insert(new_patient);
    db.saveDatabase();
    console.log("...patient successfully added to db");
    resolve("...patient successfully added to db");
  })
  );
}

function editPatient(pid, fname, lname, bdate, oldId) {
  patients = db.getCollection("patients");
  var tmp = patients.findOne({'id': oldId});
  tmp.id = pid;
  tmp.firstname = fname;
  tmp.lastname = lname;
  tmp.birthdate = bdate;
  patients.update(tmp);
}

function addMedicationToDB(new_med) {
  console.log("Adding patient to db ...");
  console.log(medications);
  medications.insert(new_med);
  db.saveDatabase();
  console.log("...medication successfully added to db");
}

function addEntry(new_entry){
  console.log("Adding new entry to db ...");
  console.log(entries);
  entries.insert(new_entry);
  db.saveDatabase();
  console.log("...entry successfully added to db");
}

function addVisit(new_visit) {
  console.log("Adding new visit to db ...");
  //console.log(visits);
  visits.insert(new_visit);
  db.saveDatabase();
  console.log("...entry successfully added to db");
}

function addMedicationUpdate(new_medication_update) {
  console.log("Adding new medication update to db...")
  medicationUpdates.insert(new_medication_update);
  db.saveDatabase();
  console.log("...entry successfully added to db");
}

function addPDFPreset(new_pdf_preset) {
  console.log("Adding PDF preset to db...")
  pdfPresets.insert(new_pdf_preset);
  db.saveDatabase();
  console.log("...entry successfully added to db");
}

function addDevice(device) {
  return(new Promise(function(resolve, reject){
    console.log("Adding PDF preset to db...")
    devices.insert(device);
    db.saveDatabase();
    console.log("...entry successfully added to db");
    resolve("...patient successfully added to db");
  })
  );
}

function generatePatientID(){
  var patient_id;
  patients = db.getCollection("patients");
  var data = db.getCollection("patients").chain().simplesort('id',false).data();
  var ids = [];
  for(var i = 0; i < data.length; i++) {
    var tmp = data[i].id;
    ids.push(Number(tmp.substring(3,tmp.length)));
  }
  try{
    if (patients === null || data.length == 0){
      patient_id = "uku"+1;
    }else{
      patient_id = "uku"+(Math.max(...ids)+1);
    }
    //console.log("Generated ID: " + patient_id.toString());
    return patient_id.toString();
  }catch(error){
    console.log("An error occcured and the patient could not be successfully created!");
    console.log(error.message);
  }
}

function readAllPatients(){
  if (db.getCollection("patients") != null) {
    return db.getCollection("patients").chain().simplesort('id',false).data();
  }else{
    return null;
  }
}

function readUUID(uuid) {
  return(new Promise(function(resolve, reject){
    devices = db.getCollection("devices");
    console.log('All Devices: ' + devices.data.length);
    var results = devices.chain().find({'uuid':uuid}).data();
    console.log('These devices: ' + results.length);
    resolve(results);
  })
  );
}

function getStatus(){
  return status;
}

function readMedication(pid, fname, lname){
  console.log("meds " + medications.data.length);
  medications = db.getCollection("medications");
  var results = medications.findOne({'$and':[{'pid':pid},{'fname':fname},{'lname':lname}]});
  if (!results === null){
    console.log("search results: " + results.length);
    console.log("search date: " + results.mdate);
    console.log("search medicament: " + results.medication);
  }
  return results;
}

function readEntries(pid){
  db.loadDatabase({}, function (results) {
    status = false;
    entries = db.getCollection("entries");
    console.log("entries " + entries.data.length);
    db.on("loaded", () => {
      status = true;
    });
  });
  //entries = db.getCollection("entries");
  var results = entries.chain().find({'pid':pid}).simplesort('idate').data();
  console.log("Actual Results : " + results.length);
  return results;
}

function readPidEntries(pid){
  return(new Promise(function(resolve, reject){
      entries = db.getCollection("entries");
      console.log('All entries: ' + entries.data.length);
      var results = entries.chain().find({'pid':pid}).simplesort('idate').data();
      console.log('These entries: ' + results.length);
      resolve(results);
  })
  );
}

function readVisits(pid){
  db.loadDatabase({}, function () {
    //entries = db.getCollection("visits");
    visits = db.getCollection("visits");
    console.log("visits " + visits.data.length);
  });
  //visits = db.getCollection("visits");
  var results = visits.chain().find({'pid':pid}).simplesort('visit_date').data();
  console.log("Actual Visits : " + results.length);
  return results;
}

function readPidVisits(pid){
  return(new Promise(function(resolve, reject){
      visits = db.getCollection("visits");
      console.log('All visits: ' + visits.data.length);
      var results = visits.chain().find({'pid':pid}).simplesort('visit_date').data();
      console.log('These visits: ' + results.length);
      resolve(results);
  })
  );
}

function readMedUpdates(pid){
  db.loadDatabase({}, function () {
    medicationUpdates = db.getCollection("medicationUpdates");
    console.log("medicationUpdates " + medicationUpdates.data.length);
  });
  //medicationUpdates = db.getCollection("medicationUpdates");
  var results = medicationUpdates.chain().find({'pid':pid}).simplesort('idate').data();
  console.log("Actual medUpdates : " + results.length);
  return results;
}

function readPidMedUpdates(pid){
  return(new Promise(function(resolve, reject){
      medicationUpdates = db.getCollection("medicationUpdates");
      console.log('All MedUpdates: ' + medicationUpdates.data.length);
      var results = medicationUpdates.chain().find({'pid':pid}).simplesort('idate').data();
      console.log('These medupdates: ' + results.length);
      resolve(results);
  })
  );
}

function readPDFPresets(){
  return(new Promise(function(resolve, reject){
      pdfPresets = db.getCollection("pdfPresets");
      var results = pdfPresets.chain().data();
      resolve(results);
  })
  );
}

//returns true if entry for a certan id and year/month/day/time is already in database
function checkDuplicateEntry(entry) {
  entries = db.getCollection("entries");
  medicationUpdates = db.getCollection("medicationUpdates");  
  var resultsEntries = entries.chain().find({'$and':[{'pid':entry.pid},{'idate':entry.idate}]}).data();
  var resultsMedicationUpdates = medicationUpdates.chain().find({'$and':[{'pid':entry.pid},{'idate':entry.idate}]}).data();
  if(resultsMedicationUpdates.length>0) {
    console.log("DB debug: Medikations-Updates vorhanden")
  }

  if(resultsEntries.length > 0 || resultsMedicationUpdates.length > 0) {
    return true;
  }else {
    return false;
  }
}

function checkForID(entry) {
  if(/uku[0-9]+/.test(entry.pid)) { //old ID format
    return(new Promise(function(resolve, reject){
      patients = db.getCollection("patients");
      var results = patients.chain().find({'id':entry.pid}).data();
      var res = false;
      if(results.length > 0) {
        res = true;
      }else {
        res =  false;
      }
      resolve(res);
    })
    );
  }else { //UUID format
    return(new Promise(function(resolve, reject){
      devices = db.getCollection("devices");
      var results = devices.chain().find({'uuid':entry.pid}).data();
      var res = false;
      if(results.length > 0) {
        res = true;
      }else {
        res =  false;
      }
      resolve(res);
    })
    );
  }
}

function updateMedication(oldId, fname, lname, new_med){
  var results = medications.findOne({'$and':[{'pid':oldId},{'fname':fname},{'lname':lname}]});
  results = new_med;
  medications.update(results);
  db.saveDatabase();
}

// when patient ID is changed, all entries must be updated
function updateEntries(oldId, newId) {
  var results = entries.chain().find({'pid':oldId}).data();
  for(var i = 0; i < results.length; i++) {
    results[i].pid = newId;
  } 
  entries.update(results);
}

// when patient ID is changed, all visits must be updated
function updateVisits(oldId, newId) {
  var results = visits.chain().find({'pid':oldId}).data();
  for(var i = 0; i < results.length; i++) {
    results[i].pid = newId;
  } 
  visits.update(results);
}

// when patient ID is changed, all medication Updates must be updated
function updateMedicationUpdates(oldId, newId) {
  var results = medicationUpdates.chain().find({'pid':oldId}).data();
  for(var i = 0; i < results.length; i++) {
    results[i].pid = newId;
  } 
  medicationUpdates.update(results);
}

module.exports.addPatientToDB = addPatientToDB;
module.exports.addMedicationToDB = addMedicationToDB;
module.exports.generatePatientID = generatePatientID;
module.exports.readAllPatients = readAllPatients;
module.exports.readUUID = readUUID;
module.exports.readMedication = readMedication;
module.exports.updateMedication = updateMedication;
module.exports.getStatus = getStatus;
module.exports.addEntry = addEntry;
module.exports.addVisit = addVisit;
module.exports.addMedicationUpdate = addMedicationUpdate;
module.exports.addPDFPreset = addPDFPreset;
module.exports.addDevice = addDevice;
module.exports.readVisits = readVisits;
module.exports.readEntries = readEntries;
module.exports.checkDuplicateEntry = checkDuplicateEntry;
module.exports.checkForID = checkForID;
module.exports.readMedUpdates = readMedUpdates;
module.exports.readPidEntries = readPidEntries;
module.exports.readPidVisits = readPidVisits;
module.exports.readPidMedUpdates = readPidMedUpdates;
module.exports.readPDFPresets = readPDFPresets;
module.exports.databaseInit = databaseInit;
module.exports.editPatient = editPatient;
module.exports.updateEntries = updateEntries;
module.exports.updateVisits = updateVisits;
module.exports.updateMedicationUpdates = updateMedicationUpdates;
