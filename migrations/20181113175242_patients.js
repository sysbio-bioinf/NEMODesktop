exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("patients", function(table) {
      table.increments();
      table.string("patient_id", 10).unique();
      table.string("name", 50);
      table.string("insurance_card_nr", 20);
      table.string("notice");
      table.jsonb("meta");
      table.string("recorded_on");
      table.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("patients");
};
