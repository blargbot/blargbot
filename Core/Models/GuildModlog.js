const Base = require('./Base');

class GuildModlogModel extends Base {
  constructor(client, db) {
    super(client, db);

    this.model = db.define('guild_modlog', {
      guildId: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.Guild,
          key: 'guildId'
        },
        allowNull: false,
        primaryKey: true
      },
      caseId: {
        type: this.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        default: 1
      },
      msgId: {
        type: this.Sequelize.BIGINT,
        allowNull: true
      },
      channelId: {
        type: this.Sequelize.BIGINT,
        allowNull: true
      },
      moderatorId: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.User,
          key: 'userId'
        }
      },
      type: {
        type: this.Sequelize.STRING,
        allowNull: false
      },
      reason: {
        type: this.Sequelize.STRING(1000)
      },
      targets: {
        type: this.Sequelize.ARRAY(this.Sequelize.BIGINT)
      }
    });
  }
}

module.exports = GuildModlogModel;