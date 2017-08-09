const Base = require('./Base');

class GuildModlogChannel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('guild_modlog_channel', {
            guildId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: this.client.models.Guild,
                    key: 'guildId'
                },
                allowNull: false,
                primaryKey: true
            },
            type: {
                type: this.Sequelize.STRING,
                allowNull: false,
                primaryKey: true
            },
            channel: {
                type: this.Sequelize.BIGINT
            }
        });
    }
}

module.exports = GuildModlogChannel;