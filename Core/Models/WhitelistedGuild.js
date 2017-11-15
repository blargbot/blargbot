const Base = require('./Base');

class WhitelistedGuildModel extends Base {
  constructor(client, db) {
    super(client, db);
    this.model = db.define('whitelistedGuild', {
      id: {
        type: this.Sequelize.BIGINT,
        primaryKey: true
      }
    });
  }
}

module.exports = WhitelistedGuildModel;