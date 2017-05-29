const Base = require('./Base');

class EventModel extends Base {
    constructor(client, db) {
        super(client, db);

        this.model = db.define('event', {
            id: {
                type: this.Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true
            },
            expiry: {
                type: this.Sequelize.DATE,
                allowNull: false
            },
            data: {
                type: this.Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            }
        });
    }
}

module.exports = EventModel;