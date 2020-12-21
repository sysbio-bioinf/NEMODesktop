// patient.js
const Bookshelf = require("../database");
const Patient = require("./patient");
const PaQRCode = Bookshelf.Model.extend(
  {
    tableName: "pa_qrcodes",
    hasTimestamps: true,
    patient: function() {
      return this.belongsTo("Patient", "patient_id");
    }
  },
  {
    jsonColumns: ["meta"]
  }
);
module.exports = Bookshelf.model("PaQRCode", PaQRCode);
