const Base = require('./Base');

class GuildCensorModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('guild_censor', {
            guildId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: _discord.models.Guild,
                    key: 'guildId'
                },
                allowNull: false,
                primaryKey: true
            },
            censorId: {
                type: this.Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
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
            deleteMessage: {
                type: this.Sequelize.STRING(2000)
            },
            kickMessage: {
                type: this.Sequelize.STRING(2000)
            },
            banMessage: {
                type: this.Sequelize.STRING(2000)
            },
            weight: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
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
                    model: _discord.models.User,
                    key: 'userId'
                },
                allowNull: false
            }
        });
    }
}

module.exports = GuildCensorModel;