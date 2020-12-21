// patient.js
const Bookshelf = require("../database");
const Patient = require("./patient");
const DrQRCode = Bookshelf.Model.extend(
  {
    tableName: "dr_qrcodes",
    hasTimestamps: true,
    patient: function() {
      return this.belongsTo("Patient", "patient_id");
    }
  },
  {
    jsonColumns: ["meta"]
  }
);
module.exports = Bookshelf.model("DrQRCode", DrQRCode);
