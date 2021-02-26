class QRCode {
   
    /*
    generate QR-Code from content in QRCode object with given size
    returns image as binary data
    */
    static generateQRCode(content, height, width)
    {
        var ZXing = require('nativescript-zxing');
        var zx = new ZXing();
        var img = zx.createBarcode({encode: content, height: height, width: width, format: ZXing.QR_CODE});
        return img;
    }

    /* 
    read qrcode image as binary data
    decode qrcode image to corresponding data as string
    
    */
    static parseQRCode(binaryData)
    {
        //TODO: currently load nativescript library. change to javascript, for desktop app?
        var ZXing = require('nativescript-zxing');
        var zx = new ZXing();
        var options = {tryHarder: true, formats: [ZXing.QR_CODE]};
        //try to read code from binary image data
        var results = zx.decodeBarcode(binaryData, options);
        if (!results) {
            console.log("Unable to decode barcode");
            return "";
        }
        else 
        {
            console.log("Barcode format", results.format);
            console.log("Barcode value", results.barcode);
            return(results.barcode);
        }
    }
  

  /*
  parse a list of database records to string
  */
  static parseRecordsToString(records)
 {
    var res = "";
    for (var idx = 0; idx < records.length; idx++) {
        res += records[idx].year + " "
            + records[idx].month + " "
            + records[idx].day + " "
            + records[idx].time + " " 
            + records[idx].general + " "
            + records[idx].dia + " "
            + records[idx].eat + " "
            + records[idx].pain + " "
            + records[idx].oral + " "
            + records[idx].appetite + " "
            + records[idx].activity + " "
            + records[idx].weight + " " 
            + records[idx].fatigue + " "
            + records[idx].hypertension + " "
            + records[idx].eczema + " "
            + records[idx].liver + " "
            + records[idx].vision + " "
            + records[idx].raceheart + " "
            + records[idx].muscle + " "
            + records[idx].joint + " "
            + records[idx].breath + " "
            + records[idx].exercise + " "
            + records[idx].comments + ", ";
    } 
        
    return res;
 }

 /*
 check if string from QR Code is in correct format
 */
//  static checkString(str) 
//  {
//     var array = str.split("; "); //split to get patient ID

//     if (array.length < 2) { console.log("array Länge falsch"); return false; } // split has no patient ID

//         var patientId = Number(array[0]);
//         if(typeof patientId != "number") { console.log("ID nicht numerisch"); return false; } //cast unsuccessful 

//         var restArray = array[1];
//         var restArraySplit = restArray.split("~ "); // all entries to patient as strings
//         for (var idx = 0; idx < (restArraySplit.length-1); idx++) {
            
//             var current = restArraySplit[idx];
//             var currentSplit = current.split(" ");
//             if (currentSplit.length < 13) {
//                 console.log("array Länge falsch"); 
//                 return false;
//             }
//             var timeSplit = currentSplit[3].split(":");

//             // check if Dates are in correct format
//             var year = Number(currentSplit[0]);
//             if((typeof year != "number") || year < 0) { console.log("Jahr keine Nummer"); return false; }
//             var month = Number(currentSplit[1]);
//             if((typeof month != "number") || month < 1 || month > 12) { console.log("Monat keine Nummer");  return false; }
//             var day = Number(currentSplit[2]);
//             if((typeof day != "number") || day < 1 || day > 31) { console.log("Tag keine Nummer"); return false; }
//             var hour = Number(timeSplit[0]);
//             if((typeof hour != "number") || hour < 0 || hour > 23 ) { console.log("Stunde keine Nummer"); return false; }
//             var minute = Number(timeSplit[1]);
//             if((typeof minute != "number") || minute < 0 || minute > 59 ) { console.log("Minute keine Nummer"); return false; }
//             var second = Number(timeSplit[2]);
//             if((typeof second != "number") || second < 0 || second > 59 ) { console.log("Sekunde keine Nummer"); return false; }

//             // check if answers are in correct format
//             for (var sidx = 4; sidx < 11 ; sidx++) {
//                 var tmp = Number(currentSplit[sidx]);
//                 if((typeof tmp != "number") || tmp < 0 || tmp > 3 ) { console.log("Entry keine Nummer"); return false; }
//             }

//             var weight = Number(currentSplit[11]);
//             if((typeof weight != "number") || weight < 0 ) { console.log("Gewicht falsch"); return false; }

//             var comment = "";
//             for(var idxx = 12; idxx < currentSplit.length; idxx++) {
//                 comment += currentSplit[idxx] + " ";
//             }

//             if((typeof comment != "string") ) { console.log("Kommentar falsch"); return false; }
//         }
//         return true;
    
//  }

static checkString(str) 
 {
    var array = str.split(";"); //split to get patient ID and number of QR code
    if (!(array.length !=3 || array.length != 4)) { console.log("array Länge falsch"); return false; } // either length = 2 (successive QR code) or length = 3 (initial QR code)

    var versionNumber = String(array[0]);
    if(/v[^0-9]/.test(versionNumber)) { console.log("Versionsnummer ungültig."); return false; }

    //var patientId = String(array[1]);
    //if(/uku[^0-9]/.test(patientId) || Number(patientId) <= 0) { console.log("ID nicht alphanumerisch oder == 0"); return false; } //cast unsuccessful 
    
    var qrIdx = Number(array[3]);
    if(typeof qrIdx != "number" || qrIdx < 1) { console.log("QR-Code Index nicht numerisch"); return false; } //cast unsuccessful 

    var restArray = array[2];
        
        var restArraySplit = restArray.split("~ "); // all entries to patient as strings
        for (var idx = 0; idx < (restArraySplit.length-1); idx++) {
            
            var current = restArraySplit[idx];
            var currentSplit = current.split(" ");
            if (currentSplit.length < 22) {
                console.log("array Länge falsch"); 
                return false;
            }

            // Date check
            console.log(currentSplit[0]);
            var idate = currentSplit[0];
            var idateSplit = idate.split("-");
            var clockTmp = idateSplit[3];
            var clock = clockTmp;
            //if(clockTmp.length > 5) {
            //    clock = clockTmp.substring(1,6);
            //}
            //console.log(clock);
            var idateString = idateSplit[0]+"-"+idateSplit[1]+"-"+idateSplit[2]+"T"+clock;
            idate = new Date(idateString);
            console.log(idate);
            
            //console.log(typeof(idate));
            if(!(idate instanceof Date)) { console.log("Datum kein Date"); return false; }

            // check if answers of CTCAE block are in correct format
            for (var sidx = 1; sidx < 8 ; sidx++) {
                var tmp = Number(currentSplit[sidx]);
                if((typeof tmp != "number") || tmp < -1 || tmp > 3 ) { console.log("Entry keine Nummer"); return false; }
            }

	    // check format of weight
            var weight = Number(currentSplit[9]);
            if((typeof weight != "number") || weight < -1.0 ) { console.log("Gewicht falsch"); return false; }

	    // check medication format
            var medication = Number(currentSplit[10]);
            if((typeof medication != "number") || (medication != - 1 && medication != 0 && medication != 1) ) { console.log("Medikation falsch"); return false; }

	    // 
	    // check format of targeted tumor therapy block
	    //	

	    // check format of fatigue
	    var fatigue;
	    if(currentSplit[11]=="undefined" || currentSplit[11] == "null") {
		fatigue=-1;
	    }else {
		fatigue = Number(currentSplit[11]);
	    }
	
	    if((typeof fatigue != "number") || (fatigue < -1) || (fatigue > 3)) { console.log("Müdigkeit falsch"); return false; }

	    // check format of hypertension
	    var hypertension;
	    if(currentSplit[12]=="undefined" || currentSplit[13] == "null") {
		hypertension=-1;
	    }else {
		hypertension = Number(currentSplit[12]);
	    }

	    if((typeof hypertension != "number") || (hypertension < -1) || (hypertension > 3)) { console.log("Blutdruck falsch"); return false; }

	    // check format of binary targeted therapy fields
	    for (var sidx = 13; sidx < 15; sidx++) {
		var tmp = currentSplit[sidx];
		if(tmp == "undefined" || tmp == "null") {
			tmp = -1;
		}else {
			tmp = Number(currentSplit[sidx]);
		}
		if((typeof tmp != "number") || tmp < -1 || tmp > 1) { console.log("Targeted Entry falsch"); return false; }
	    }

	    // check racing heart (Puls)
	    var raceHeart;
	    if(currentSplit[16]=="undefined" || currentSplit[16] == "null") {
		raceHeart=-1;
	    }else {
		raceHeart = Number(currentSplit[16]);
	    }

	    if((typeof raceHeart != "number") || (raceHeart < -1) || (raceHeart > 300)) { console.log("Puls falsch"); return false; }

	    for (var sidx = 17; sidx < 20; sidx++) {
		var tmp = currentSplit[sidx];
		if(tmp == "undefined" || currentSplit == "null") {
			tmp = -1;
		}else {
			tmp = Number(currentSplit[sidx]);
		}
		if((typeof tmp != "number") || tmp < -1 || tmp > 1) { console.log("Targeted Entry falsch"); return false; }
	    }
	
	    // check format of comment field
            var comment = "";
            for(var idxx = 21; idxx < currentSplit.length; idxx++) {
                comment += currentSplit[idxx] + " ";
            }

            if((typeof comment != "string") ) { console.log("Kommentar falsch"); return false; }
        }
        return true;
    
 }

 /*
 parse a string to a list of records to be added in the database
 assumes that str is already checked with method above
 */
//  static parseStringToRecords(str)
//  {
//     var res = [];
//     var array = str.split("; "); //split to get patient ID

//     var patientId = String(array[0]);
//     var restArray = array[1];
//     var restArraySplit = restArray.split("~ "); // all entries to patient as strings
//     for (var idx = 0; idx < (restArraySplit.length-1); idx++) {
//         var current = restArraySplit[idx];
//         var currentSplit = current.split(" ");

//         var year = Number(currentSplit[0]);
//         var month = Number(currentSplit[1]);
//         var day = Number(currentSplit[2]);
//         var time = String(currentSplit[3]);
//         var input_date = new Date(year + '-' + month + '-' + day + ' ' + time);
//         var general = currentSplit[4];
//         var dia = currentSplit[5];
//         var eat = currentSplit[6];
//         var pain = currentSplit[7];
//         var oral = currentSplit[8];
//         var appetite = currentSplit[9];
//         var activity = currentSplit[10];
//         var weight = currentSplit[11];
        
//         var comments = "";
//             for(var idxx = 12; idxx < currentSplit.length; idxx++) {
//                 comments += currentSplit[idxx] + " ";
//             }

//         var new_entry = {pid: patientId,
//             idate: input_date,
//             year: year,
//             month: month,
//             day: day,
//             time: time,
//             general: general,
//             dia: dia,
//             eat: eat,
//             pain: pain,
//             oral: oral,
//             appetite: appetite,
//             activity: activity,
//             weight: weight,
//             comments: comments};
//         res.push(new_entry);
//     }
//     return(res);
//  }
// };

static parseStringToRecords(str)
 {
    var res = [];
    var array = str.split(";"); //split to get patient ID
        
    var versionNumber = String(array[0]);
    var patientId = String(array[1]);

    // if PatientID Is in Format 1,2 ..., change it to uku1, etc.
    if(typeof Number(patientId) == "number" && Number(patientId) > 0) {
        patientId = "uku"+Number(patientId);
    }else { //UUID
        patientId = patientId;
    }
    console.log(patientId);

    var restArray = array[2];
    var restArraySplit = restArray.split("~ "); // all entries to patient as strings
    for (var idx = 0; idx < (restArraySplit.length-1); idx++) {
        var current = restArraySplit[idx];
        var currentSplit = current.split(" ");

            var idate = currentSplit[0];
            var idateSplit = idate.split("-");
            var clockTmp = idateSplit[3];
            var clock = clockTmp;
            //if(clockTmp.length > 5) {
            //    clock = clockTmp.substring(1,6);
            //}
            console.log(clock);
            var input_date = idateSplit[0]+"-"+idateSplit[1]+"-"+idateSplit[2]+"T"+clock;
            //var input_date = new Date(idateString);
            //console.log(idate);

        var general = currentSplit[1];

        // general is -1 => just a medication update
        if(general == -1) {
            var new_entry = {pid: patientId,
                idate: input_date};
            res.push(new_entry);
        }else {
	    //CTCAE
            var dia = currentSplit[2];
            var eat = currentSplit[3];
            var pain = currentSplit[4];
            var oral = currentSplit[5];
            var appetite = currentSplit[6];
            var pnp = currentSplit[7];
            var activity = currentSplit[8];
            var weight = currentSplit[9];
            var medication = currentSplit[10];

	    //targeted therapy
	    var fatigue = currentSplit[11];
	    var hypertension = currentSplit[12];
	    var eczema = currentSplit[13];
	    var liver = currentSplit[14];
	    var vision = currentSplit[15];
	    var raceheart = currentSplit[16];
	    var muscle = currentSplit[17];
	    var joint = currentSplit[18];
	    var breath = currentSplit[19];
	    var exercise = currentSplit[20];
            
            var comments = "";
            for(var idxx = 21; idxx < currentSplit.length; idxx++) {
                 comments += currentSplit[idxx] + " ";
            }

            var new_entry = {versionNumber: versionNumber,
		        pid: patientId,
                idate: input_date,
                general: general,
                dia: dia,
                eat: eat,
                pain: pain,
                oral: oral,
                appetite: appetite,
                pnp: pnp,
                activity: activity,
                weight: weight,
                medication: medication,
                fatigue: fatigue,
                hypertension: hypertension,
                eczema: eczema,
                liver: liver,
                vision: vision,
                raceheart: raceheart,
                muscle: muscle,
                joint: joint,
                breath: breath,
                exercise: exercise,
                comments: comments};
            res.push(new_entry);
            
        }
    }
    return(res);  
 }

 static parseNumberQRCodes(str)
 {
    var array = str.split(";"); //split to get number of overall QR Codes (included in last QR code)
        
    if(array.length==4) {
        return(array[3]);
    }else {
        return(-1);
    } 
 }

};



module.exports = QRCode;

