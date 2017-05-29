const Base = require('./Base');
const User = require('./User');

class UserNameModel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('user_name', {
            userId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: this.client.models.User,
                    key: 'userId'
                },
                allowNull: false
            },
            id: {
                type: this.Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            username: {
                type: this.Sequelize.STRING(32),
                allowNull: false
            },
            discriminator: {
                type: this.Sequelize.INTEGER,
                allowNull: false
            },
            date: {
                type: this.Sequelize.DATE,
                allowNull: false,
                defaultValue: this.Sequelize.NOW
            }
        });
    }
}

module.exports = UserNameModel;