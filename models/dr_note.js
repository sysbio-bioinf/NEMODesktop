// patient.js
const Bookshelf = require("../database");
const Patient = require("./patient");
const DrNote = Bookshelf.Model.extend(
  {
    tableName: "dr_notes",
    hasTimestamps: true,
    patient: function() {
      return this.belongsTo("Patient", "patient_id");
    }
  },
  {
    jsonColumns: ["meta"]
  }
);
module.exports = Bookshelf.model("DrNote", DrNote);
