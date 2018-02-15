const Base = require('./Base');

class GuildWarningModel extends Base {
  constructor(client, db) {
    super(client, db);

    this.model = db.define('guild_warning', {
      guildId: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.Guild,
          key: 'guildId'
        },
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: this.Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true
      },
      count: {
        type: this.Sequelize.INTEGER,
        allowNull: false,
        default: 0
      }
    });
  }
}

module.exports = GuildWarningModel;