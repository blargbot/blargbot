const Base = require('./Base');

class UserModel extends Base {
    constructor(db) {
        super(db);
        this.model = db.define('user', {
            userId: {
                type: this.Sequelize.BIGINT,
                unique: true,
                primaryKey: true,
                allowNull: false
            },
            disciminator: {
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
                defaultValue: 'en_US'
            }
        });
    }
}

module.exports = UserModel;