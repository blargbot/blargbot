const Base = require('./Base');

module.exports = class BBTagVariableModel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('bbtag_variable', {
            name: {
                type: this.Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: this.Sequelize.ENUM(
                    'GUILD_TAG', 'GUILD_CC', 'LOCAL_TAG', 'LOCAL_CC', 'AUTHOR', 'GLOBAL'
                ),
                primaryKey: true,
                allowNull: false
            },
            scope: {
                type: this.Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            },
            content: {
                type: this.Sequelize.TEXT,
                allowNull: false
            }
        });
    }
}