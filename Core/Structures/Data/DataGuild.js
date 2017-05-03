const Base = require('./DataBase');

class DataGuild extends Base {
    constructor(id) {
        super(id, 'Guild');
    }

    async getLocale() {
        return await this.getKey('locale');
    }

    async setLocale(locale) {
        return await this.setKey('locale', locale);
    }

    async getVariable(name) {
        let vars = await this.getKey('vars');
        if (!vars) vars = {};
        return vars[name];
    }

    async setVariable(name, value) {
        return await this.setKey('vars', { [name]: value });
    }

}

module.exports = DataGuild;