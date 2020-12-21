exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("dr_qrcodes", function(table) {
      table.increments();
      table.string("content");
      table.jsonb("meta");
      table.string("sent_on");
      table.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("dr_qrcodes");
};
