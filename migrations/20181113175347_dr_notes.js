exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("dr_notes", function(table) {
      table.increments();
      table.string("notice");
      table.integer("had_qrcode"); // 1 or 0, if a qrcode has been created and sent to patient
      table.jsonb("meta");
      table.string("sent_on");
      table.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("dr_notes");
};
