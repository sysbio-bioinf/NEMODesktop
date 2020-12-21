// patient.js
const Bookshelf = require("../database");
const PaQRCode = require("./pa_qrcode");
const DrQRCode = require("./dr_qrcode");
const DrNote = require("./dr_note");
const Patient = Bookshelf.Model.extend(
  {
    tableName: "patients",
    hasTimestamps: true,
    verifyInsuranceCardNr: function(cardNumber) {
      return this.get("insurance_card_nr") === cardNumber;
    },

    sentQRCodes: function() {
      return this.hasMany("PaQRCode", "patient_id");
    },

    gotQRCodes: function() {
      return this.hasMany("DrQRCode", "patient_id");
    },

    gotDrNotes: function() {
      return this.hasMany("DrNote", "patient_id");
    }
  },
  {
    jsonColumns: ["meta"]
  }
);

module.exports = Bookshelf.model("Patient", Patient);
