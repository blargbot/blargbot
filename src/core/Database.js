const pg = require('pg');
delete pg.native;
const Sequelize = require('sequelize');

module.exports = class Database {
    constructor(client) {
        this.client = client;
        this.models = {};
        this.sequelize = new Sequelize(
            config.postgres.database,
            config.postgres.user,
            config.postgres.pass, {
                operatorsAliases: false,
                host: config.postgres.host,
                dialect: 'postgres',
                logging: console.database,
                ...config.sequelize
            }
        );
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.init('Connected to postgres. Loading models...');
            await this.loadModels();
        } catch (err) {
            console.error('Failed to connect to postgres, retrying in 5 seconds', err);
            await this.sleep(5 * 1000);
            return await this.authenticate();
        }
    }

    sleep(time) {
        return new Promise((res, rej) => {
            setTimeout(res, time);
        });
    }

    async loadModels() {
        const models = require('./models');
        this.models = {};
        this.client.models = {};
        for (const key in models) {
            this.models[key] = new models[key](this.client, this.sequelize);
            await this.models[key].model.sync({ force: false, alter: false });
            this.client.models[key] = this.models[key].model;
        }
        console.init('Database models loaded.');
    }
};