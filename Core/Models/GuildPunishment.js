const Base = require('./Base');

class GuildPunishmentModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('guild_punishment', {
            guildId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: _discord.models.Guild,
                    key: 'guildId'
                },
                allowNull: false,
                primaryKey: true
            },
            weight: {
                type: this.Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false
            },
            duration: {
                type: this.Sequelize.INTEGER,
                comment: 'An optional duration (auto unmute, auto unban), in milliseconds'
            },
            type: {
                type: this.Sequelize.ENUM,
                values: ['ban', 'kick', 'mute']
            }
        });
    }
}

module.exports = GuildPunishmentModel;