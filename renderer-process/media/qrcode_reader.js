//require(path.resolve('assets/jsqrdemo'));
//require(path.resolve('assets/qr-generator'));

var QRCode = require(path.resolve(__dirname, "../../models/QRCode"));
//var QRCode = require(path.resolve("models/QRCode"));
var database = require(path.resolve(__dirname, "../../database"));
var iconv = require('iconv-lite');
const { ipcRenderer } = require('electron');
//var UVCControl = require('uvc-control');

//var camera = new UVCControl(0x46d, 0x85e);


/*
camera.set('autoFocus', 0, function(error) {
	if (!error) {
		console.log('AutoFocus set to 0!');
	}else {
        console.log('AutoFocus not set to 0!');
    }
});

camera.set('autoFocus', 1, function(error) {
	if (!error) {
		console.log('AutoFocus set to 1!');
	}else{
        console.log('AutoFocus not set to 1!');
    }
});
*/
var QRheader = document.getElementById("QRheader");
var DBheader = document.getElementById("DBheader");
//var AlreadyDBheader = document.getElementById("AlreadyDBheader");
var QRcnt = 0;
var newcnt = 0;
var tmp = 0;
var patientIDinvalid = false;

var readEntries = new Array();

var entriesInDb = new Array();
var MedUpdatesInDb = new Array();

var camID = -1;
ipcRenderer.on('checkbox-content', (event, arg) => {
    camID = parseInt(arg);
    run_cam(camID);
});

// if window is opened via button, send webContents to reset newcnt to zero
ipcRenderer.on('resetNewcnt', async (event,arg) => {
	await resetNewcnt();
	await updateQRNotification(newcnt);
});

async function resetNewcnt() {
	var newcntTmp = await new Promise((resolve, reject) => {
		resolve(0);
	})
	newcnt = newcntTmp;
}

async function sleep(duration) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve()
		}, duration * 1000)
	})
}

ipcRenderer.on('QRcodeConfirmation', async (event, arg) => {
	if(!arg) {
		newcnt++;
		await updateQRNotification(newcnt);
	}else {
		tmp++;
	}
});

async function updateQRNotification(newcnt) {
	return new Promise((resolve, reject) => {
		DBheader.innerText = "Neue QR-Codes: " + newcnt + " Codes";
	})
}

function checkEntriesForEquality(a,b) {
	//pid and idate must be the same for all elements of a and b
	var retVal = true;

	if(a.length != b.length) {
		retVal = false;
	}else {
		for(var i = 0; i < a.length; i++) {
			if( (a[i].pid != b[i].pid) || (a[i].idate != b[i].idate) ) {
				retVal = false;
			}
		}
	}
	return retVal;
}
var pushed = 0;
var tmpII = -1;
var qrCodes = {};
var qrIndex = 0;
var newCodesForAlert = 0;

function run_cam(camID){
	Camera.getCameras()
	    .then(function (cameras) {
		let scanner = new Scanner({
		    video: document.getElementById("preview"),
			captureImage: true,
			mirror: false
		    //continuous: false
		});

		const cancel_button = document.getElementById("qr_cancel");
		cancel_button.addEventListener('click', () => {
		    var data = 0;
			scanner.stop();
			resetWindow();
		    ipcRenderer.send('hide-qrwindow', data);
		}) 

		if (cameras.length > 0) {
		    //alert('Starting camera ' + camID);
		    //scanner.start(cameras[0]);

		    scanner.start(cameras[camID])
		        .then(async function () {
					qrCodes = {};
                    qrIndex = 0;
		            scanner.addListener('scan', async function (content, img) {
		                //Instascan assumes ISO format for QR Code, decode to utf8
		                var buf = iconv.encode(content, 'ISO-8859-1');
		                var newcontent = iconv.decode(buf,'utf8');
						
						var numberQRs= QRCode.parseNumberQRCodes(content);
						if(numberQRs>-1) {
							tmpII = numberQRs; // if number of overall QR codes is decoded, save it in tmpII
						} 

						if (QRCode.checkString(newcontent)) {
							// increases QR Code recognition rate: already recognized QR codes are skipped
							if (qrCodes[newcontent]) {
								console.log("DEBUG:  scanned again #" + qrCodes[newcontent]);
								return;
							} else {
								qrIndex++;
								qrCodes[newcontent] = qrIndex;
							}
							// parse entries in QR Code
							var entries = QRCode.parseStringToRecords(newcontent);
							
							// readEntries summarizes all entries
							// if array is empty, push first entry
							if(readEntries.length < 1) {
								readEntries.push(entries);
								pushed++;
							}else { // else check if entry is already included in Array
								var isIncluded = false;
								for(var idx = 0; idx < readEntries.length; idx++) {
									if(checkEntriesForEquality(entries,readEntries[idx])) {
										isIncluded = true;
									}
								}

								if(!(isIncluded)) {
									readEntries.push(entries);
									pushed++; // pushed summarizes how many entries were added to readEntries Array
								}
							}

						// first check, if patient id is in database. If not, reset window.
						ipcRenderer.send('checkID',entries[0]);
						ipcRenderer.once('checkIDconfQR', async function(event,arg) {
							patientIDinvalid = arg;
							
							if(!patientIDinvalid) {
								alert("Patienten-ID nicht in Datenbank vorhanden");
								resetWindow();
								scanner.stop();
								ipcRenderer.send('hide-qrwindow', 0);
							}else {
								//minimum 1 entry has to be included in QR Code, get PID to check if it is valid
								//this creates a chain of events between data-visualisation.js and main.js to add new entries to DB, old ones not
								//in the end, a confirmation is sent to this window  
								ipcRenderer.send('getEntries',entries);
								QRcnt++;
								
								//QRheader.innerText = "Gelesene QR-Codes: " + pushed + " Codes";
	
								// newcnt: is increased when QRcodeConfirmation is sent via the ipcRenderer
								// only increased when it is NOT already in database
								if(tmpII>-1) {
									QRheader.innerText = "Gelesene QR-Codes: " + pushed +"/" +tmpII +" Codes";
									//DBheader.innerText = "Neue QR-Codes: " + newcnt + "/" + tmpII + " Codes";
									//AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + "/" + tmpII + " Codes";
								}else {
									QRheader.innerText = "Gelesene QR-Codes: " + pushed + " Codes";
									//DBheader.innerText = "Neue QR-Codes: " + newcnt + " Codes";
									//AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + " Codes";
								}
								
								if((newcnt == tmpII) || (readEntries.length == tmpII)) {
									var visit_type = document.querySelector('input[name="Termin"]:checked').value;
									var regular_visit = 0;
									if(visit_type === "Regulärer Termin") {
										regular_visit = 1;
									}
									var visit_date = Date(Date.now());
									var new_visit = {pid:entries[0].pid,
													visit_date:visit_date,
													regular_visit:regular_visit
									};
									ipcRenderer.send('saveVisit',new_visit);
									await sleep(0.1);

									if(newcnt>0) {
										newCodesForAlert = newcnt;
									}
									
									alert(+readEntries.length +" QR Codes gelesen.\n"+
										newCodesForAlert +" neue QR-Codes in Datenbank übertragen.");
									//console.log(readEntries);
									resetWindow();
									scanner.stop();
									var data = 0;
									ipcRenderer.send('hide-qrwindow', data);
								}

							}
						});

/*
				            var addedToDb = 0;
		                    var alreadyInDb = 0;
		                    for (var idx = 0; idx < entries.length; idx++) {
		                        //console.log(entries[idx].comments);
					
					var entry = entries[idx];
					if(Object.keys(entry).length == 2) { // Eintrag ist Änderung der Medikation
						//database.addMedicationUpdate(entry);
						if(!allMedUpdates.includes(entry)) {
							ipcRenderer.send('saveQREntries',entry);
							allMedUpdates.push(entry);
		                                	//addedToDb++;
					    	}
		                        }else { // Eintrag ist normaler Entry
						//database.addEntry(entry);
						if(!allEntries.includes(entry)) {
							ipcRenderer.send('saveQREntries',entry);
							allEntries.push(entry);
		                                	//addedToDb++;
						}
		                        }
*/
					//TODO addedToDb nur dann hochzählen, wenn die Einträge tatsächlich neu sind
					

					/*
		                        // entry is already in database or in entry vector
		                        if (database.checkDuplicateEntry(entries[idx]) || allEntries.includes(entries[idx])) {
		                            console.log(entries[idx]);
				            console.log("ist bereits da");
					    entriesInDb.push(entries[idx]);
		                            alreadyInDb++;
		                        // patient ID is not included in database
		                        } else if (!database.checkForID(entries[idx])) {
		                            alert("Patienten-ID " +entries[idx].pid +" nicht in Datenbank gefunden!");
		                            patientIDinvalid = true;
		                            break;
		                        // new entry
		                        } else {
		                            var entry = entries[idx];
		                            //console.log(Object.keys(entry).length);
		                            if(Object.keys(entry).length == 2) { // Eintrag ist Änderung der Medikation
						//database.addMedicationUpdate(entry);
						if(!allMedUpdates.includes(entry)) {
							allMedUpdates.push(entry);
		                                	addedToDb++;
					    	}
		                            }else { // Eintrag ist normaler Entry
						//database.addEntry(entry);
						if(!allEntries.includes(entry)) {
							allEntries.push(entry);
		                                	addedToDb++;
						}
		                            }
		                            
		                            //alert("Database entry created!")
		                        }
		                    }*/

				    /*var visit_date = Date(Date.now());
		                    	new_visit = {pid:entries[0].pid,
		                        visit_date:visit_date,
		                        regular_visit:regular_visit
		                    };
				    ipcRenderer.send('saveQREntries',visit_date);*/
				    
				    

		                    /*
		                    if(patientIDinvalid) {
		                        var data = 0;
		                        scanner.stop();
		                        ipcRenderer.send('hide-qrwindow', data);
		                    }else {
		                        QRcnt++; // QR Code erfolgreich gelesen
		                        var numberQRs= QRCode.parseNumberQRCodes(content);
		                        QRheader.innerText = "Gelesene QR-Codes: " + QRcnt + " Codes";
	    
		                        if((entries.length == alreadyInDb)) {
		                            tmp++;
		                            if(numberQRs > - 1) {
		                                DBheader.innerText = "Neue QR-Codes: " + newcnt + "/" + numberQRs + " Codes";
		                                AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + "/" + numberQRs + " Codes";
		                            }
		                            else {
		                                DBheader.innerText = "Neue QR-Codes: " + newcnt + " Codes";
		                                AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + " Codes";
		                            }
		                            //alert("Alle Einträge des QR-Codes bereits in Datenbank vorhanden");
		                        }else {
		                            newcnt++;
		                            if(numberQRs > - 1) {
		                                DBheader.innerText = "Neue QR-Codes: " + newcnt + "/" + numberQRs + " Codes";
		                                AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + "/" + numberQRs + " Codes";
		                            }
		                            else {
		                                DBheader.innerText = "Neue QR-Codes: " + newcnt + " Codes";
		                                AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + " Codes";
		                            }
					}
					if(tmp == numberQRs) {
					    alert("Alle QR-Codes bereits vorhanden")
					    var data = 0;
					    scanner.stop();
					    resetWindow();
		                            ipcRenderer.send('hide-qrwindow', data);
					}

		                        if((newcnt + tmp) == numberQRs) {
		                            var visit_date = Date(Date.now());
		                            new_visit = {pid:entries[0].pid,
		                                visit_date:visit_date,
		                                regular_visit:regular_visit
		                            };
		                            // only add visit if patient ID is already in DB
		                            if(database.checkForID(entries[0])) {
		                            //if(database.checkForID(entries[0]) && (alreadyInDb < entries.length)) {
		                                //database.addVisit(new_visit);
		                                allVisits.push(new_visit);
		                            }
		                            
		                            var data = 0;
					    var completeEntries = [allEntries, allMedUpdates, allVisits];
				 	    ipcRenderer.send('saveQREntries',completeEntries);
					    scanner.stop();
					    alert("Alle QR-Codes in Datenbank übertragen.");
					    resetWindow();
		                            ipcRenderer.send('hide-qrwindow', data);
		                        }
		                        //alert(addedToDb + " von " + entries.length + " Einträgen in Datenbank hinzugefügt. \n" + alreadyInDb + " Einträge bereits in Datenbank.");
		                        //var data = 0;
		                    }*/

		                } else {
		                    alert("QR Code ist nicht im richtigen Format!");
		                }

		            });
		        })
		        .catch(function (err) {
		            console.log(err);
		            scanner.stop();
		        });
		} else {
			console.error("No cameras found.");
		}
	    })
	    .catch(function (e) {
		console.error(e);
	    });
}

function resetWindow() {
	QRcnt = 0;
	newcnt = 0;
	tmp = 0;
	tmpII = -1;
	pushed = 0;
	newCodesForAlert = 0;

	allEntries = new Array();
	allMedUpdates = new Array();
	allVisits = new Array();

	readEntries = new Array();
	entriesInDb = new Array();
	MedUpdatesInDb = new Array();
	
	QRheader.innerText = "Gelesene QR-Codes: " + QRcnt + " Codes";
	DBheader.innerText = "Neue QR-Codes: " + newcnt + " Codes";
	//AlreadyDBheader.innerText = "Bereits gespeicherte QR-Codes: " + tmp + " Codes";
}
