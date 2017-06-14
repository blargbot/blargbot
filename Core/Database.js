var pg = require('pg');
delete pg.native;
const sequelize = require('sequelize');

class Database {
    constructor(client) {
        this.client = client;
        this.sequelize = new sequelize(_config.database.postgres.database,
            _config.database.postgres.user,
            _config.database.postgres.password, {
                host: _config.database.postgres.host,
                dialect: 'postgres',
                logging: _logger.database
            });
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            _logger.init('Connected to database. Loading models...');
            await this.loadModels();
        } catch (err) {
            _logger.error(err);
        }
    }

    async loadModels() {
        const models = require('./Models');
        this.models = {};
        this.client.models = {};
        for (const key in models) {
            this.models[key] = new models[key](this.client, this.sequelize);
            await this.models[key].model.sync({ force: false });
            this.client.models[key] = this.models[key].model;
        }
        _logger.init('Database models loaded. Loading Clyde');
        const clyde = this.client.getData(this.client.Constants.Types.Data.USER, 0, {
            username: 'Clyde',
            discriminator: '0000'
        });
        await clyde.getOrCreateObject();
    }
}

module.exports = Database;