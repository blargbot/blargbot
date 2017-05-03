const Base = require('./Base');

class GuildCommandModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('guild_command', {
            guildId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: _discord.models.Guild,
                    key: 'guildId'
                },
                allowNull: false,
                primaryKey: true
            },
            command: {
                type: this.Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            roles: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            },
            enabled: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        });
    }
}

module.exports = GuildCommandModel;