const sequelize = require('sequelize');

class BaseModel {
    constructor(client, db) {
        _logger.init('Loading database model ' + this.constructor.name);
        this.client = client;
        this.db = db;
        this.Sequelize = sequelize;
    }

    async sync(force = false) {
        return await this.model.sync(force);
    }
}

module.exports = BaseModel;