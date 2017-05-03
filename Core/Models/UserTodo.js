const Base = require('./Base');

class UserTodoModel extends Base {
    constructor(db) {
        super(db);

        this.model = db.define('user_todo', {
            userId: {
                type: this.Sequelize.BIGINT,
                references: {
                    model: _discord.models.User,
                    key: 'userId'
                },
                allowNull: false,
                primaryKey: true
            },
            todoId: {
                type: this.Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            content: {
                type: this.Sequelize.STRING,
                allowNull: false
            },
            active: {
                type: this.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        });
    }
}

module.exports = UserTodoModel;