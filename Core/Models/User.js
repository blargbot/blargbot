const Base = require('./Base');

class UserModel extends Base {
    constructor(client, db) {
        super(client, db);
        this.model = db.define('user', {
            userId: {
                type: this.Sequelize.BIGINT,
                unique: true,
                primaryKey: true,
                allowNull: false
            },
            discriminator: {
                type: this.Sequelize.INTEGER,
                allowNull: false
            },
            username: {
                type: this.Sequelize.STRING(32),
                allowNull: false
            },
            variables: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            },
            locale: {
                type: this.Sequelize.STRING(8),
                allowNull: false,
                defaultValue: 'en'
            },
            avatarURL: {
                type: this.Sequelize.STRING(256),
                allowNull: true
            },

            prefixes: {
                type: this.Sequelize.ARRAY(this.Sequelize.STRING),
                allowNull: false,
                defaultValue: []
            },

            dmErrors: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },

            gamatotoXp: {
                type: this.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            gamatotoStart: {
                type: this.Sequelize.DATE
            },
            gamatotoLocation: {
                type: this.Sequelize.STRING(64)
            },
            gamatoto: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {
                    xp: 0,
                    ketfud: 0,
                    speed: 0,
                    treasure: 0,
                    rich: 0,
                    cpu: 0,
                    jobs: 0,
                    sniper: 0
                }
            }
        });

    }
}

module.exports = UserModel;