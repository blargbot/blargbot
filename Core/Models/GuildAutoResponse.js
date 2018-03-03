const Base = require('./Base');

class GuildCensorModel extends Base {
  constructor(client, db) {
    super(client, db);

    this.model = db.define('guild_autoresponse', {
      guildId: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.Guild,
          key: 'guildId'
        },
        allowNull: false,
        primaryKey: true
      },
      responseId: {
        type: this.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      description: {
        type: this.Sequelize.TEXT
      },
      phrase: {
        type: this.Sequelize.STRING(1000),
        allowNull: false
      },
      regex: {
        type: this.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      userExceptions: {
        type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
        allowNull: false,
        defaultValue: []
      },
      roleExceptions: {
        type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
        allowNull: false,
        defaultValue: []
      },
      channelExceptions: {
        type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
        allowNull: false,
        defaultValue: []
      },
      author: {
        type: this.Sequelize.BIGINT,
        references: {
          model: this.client.models.User,
          key: 'userId'
        },
        allowNull: false
      },
      commandName: {
        type: this.Sequelize.VIRTUAL,
        get() {
          return '*ar_' + this.getDataValue('responseId');
        },
        comment: 'The calculated custom command name.'
      }
    });
  }
}

module.exports = GuildCensorModel;