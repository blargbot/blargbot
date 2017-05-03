const Base = require('./Base');

class ChatLogModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('chatlog', {
            id: {
                type: this.Sequelize.BIGINT,
                primaryKey: true
            },
            guildId: {
                type: this.Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: _discord.models.Guild,
                    key: 'guildId'
                }
            },
            channelId: {
                type: this.Sequelize.BIGINT,
                allowNull: false
            },
            userId: {
                type: this.Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: _discord.models.User,
                    key: 'userId'
                }
            },
            msgId: {
                type: this.Sequelize.BIGINT,
                allowNull: false
            },

            content: {
                type: this.Sequelize.STRING(2000)
            },
            embeds: {
                type: this.Sequelize.ARRAY(this.Sequelize.JSON)
            },
            attachmentUrl: {
                type: this.Sequelize.STRING
            },

            type: {
                type: this.Sequelize.ENUM,
                values: ['create', 'update', 'delete']
            }
        });
    }
}

module.exports = ChatLogModel;