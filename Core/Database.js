class Database {
    constructor(client) {
        this.client = client;
        this.sequelize = new _dep.sequelize(_config.pg.database,
            _config.pg.user,
            _config.pg.pass, {
                host: _config.pg.host,
                dialect: 'postgres',
                logging: _logger.database
            });

        this.authenticate();
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            _logger.init('Connected to database. Loading modules...');
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
            this.models[key] = new models[key](this.sequelize);
            this.models[key].model.sync(_config.beta);
            this.client.models[key] = this.models[key].model;
        }
        _logger.init('Database models loaded.');
    }
}

module.exports = Database;