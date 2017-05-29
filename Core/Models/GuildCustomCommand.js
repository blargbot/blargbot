const Base = require('./Base');

class GuildCustomCommandModel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('guild_custom_command', {
            guildId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: this.client.models.Guild,
                    key: 'guildId'
                },
                allowNull: false,
                primaryKey: true
            },
            commandName: {
                type: this.Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            roles: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            },
            help: {
                type: this.Sequelize.STRING(1000)
            },
            content: {
                type: this.Sequelize.STRING(10000),
                allowNull: false,
                defaultValue: ''
            },
            authorId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: this.client.models.User,
                    key: 'userId'
                },
                allowNull: false
            },
            variables: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            },
            locked: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        });
    }
}

module.exports = GuildCustomCommandModel;