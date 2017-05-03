class BaseModel {
    constructor(db) {
        _logger.init('Loading database model ' + this.constructor.name);
        this.db = db;
        this.Sequelize = _dep.sequelize;
    }

    async sync(force = false) {
        return await this.model.sync(force);
    }
}

module.exports = BaseModel;