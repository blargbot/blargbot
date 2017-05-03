const Base = require('./Base');

class GuildModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('guild', {
            guildId: {
                type: this.Sequelize.BIGINT,
                allowNull: false,
                primaryKey: true
            },
            active: {
                type: this.Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            name: {
                type: this.Sequelize.STRING,
                allowNull: false
            },
            variables: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            },
            tagVariables: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            },
            // Settings
            makeLogs: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            cahNsfw: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            tableflip: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            dmHelp: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            staffRoles: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            },
            kickRoles: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            },
            banRoles: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            },
            staffPerms: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 32
            },

            antiMention: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            antiMentionWeight: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            announcementChannel: {
                type: this.Sequelize.BIGINT
            },
            announcementRole: {
                type: this.Sequelize.BIGINT
            },

            greeting: {
                type: this.Sequelize.STRING(5000)
            },
            greetingChannel: {
                type: this.Sequelize.BIGINT
            },

            farewell: {
                type: this.Sequelize.STRING(5000)
            },
            farewellChannel: {
                type: this.Sequelize.BIGINT
            },

            mutedRole: {
                type: this.Sequelize.BIGINT
            },
            modlog: {
                type: this.Sequelize.BIGINT
            },

            prefixes: {
                type: this.Sequelize.ARRAY(this.Sequelize.STRING),
                allowNull: false,
                defaultValue: []
            },

            locale: {
                type: this.Sequelize.STRING(8),
                allowNull: false,
                defaultValue: 'en_US'
            },

            blacklistedChannels: {
                type: this.Sequelize.ARRAY(this.Sequelize.BIGINT),
                allowNull: false,
                defaultValue: []
            }
        });
    }
}

module.exports = GuildModel;