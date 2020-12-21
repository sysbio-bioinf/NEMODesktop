exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("pa_qrcodes", function(table) {
      table.increments();
      table.string("content");
      table.jsonb("meta");
      table.string("received_on");
      table.timestamps();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("pa_qrcodes");
};
