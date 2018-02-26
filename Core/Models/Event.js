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
      type: {
        type: this.Sequelize.TEXT
      },
      guild: {
        type: this.Sequelize.BIGINT,
        allowNull: true
      },
      start: {
        type: this.Sequelize.DATE,
        allowNull: false,
        defaultValue: Date.now()
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