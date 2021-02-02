const sequelize = require('sequelize');

module.exports = class BaseModel {
    constructor(client, db) {
        console.module('Loading database model ' + this.constructor.name);
        this.client = client;
        this.db = db;
        this.Sequelize = sequelize;
    }

    async sync(force = false) {
        return await this.model.sync(force);
    }
};