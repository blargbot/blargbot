var pg = require('pg');
delete pg.native;
const sequelize = require('sequelize');

class Database {
    constructor(client) {
        this.client = client;
        this.sequelize = new sequelize(_config.database.postgres.database,
            _config.database.postgres.user,
            _config.database.postgres.pass, {
                host: _config.database.postgres.host,
                dialect: 'postgres',
                logging: console.database
            });
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.init('Connected to database. Loading models...');
            await this.loadModels();
        } catch (err) {
            console.error('Failed to connect to the database, retrying in 5 seconds', err);
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
        const models = require('./Models');
        this.models = {};
        this.client.models = {};
        for (const key in models) {
            this.models[key] = new models[key](this.client, this.sequelize);
            await this.models[key].model.sync({ force: false, alter: _config.beta });
            this.client.models[key] = this.models[key].model;
        }
        console.init('Database models loaded. Loading Clyde');
        const clyde = this.client.getData(this.client.Constants.Types.Data.USER, 0, {
            username: 'Clyde',
            discriminator: '0000'
        });
        await clyde.getOrCreateObject();
    }
}

module.exports = Database;