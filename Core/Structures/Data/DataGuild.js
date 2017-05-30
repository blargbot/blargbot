const DataCacheBase = require('./DataCacheBase');

class DataGuild extends DataCacheBase {
    constructor(client, id, guild) {
        super(client, id, 'Guild');
        this.guild = guild || this.client.guilds.get(this.id);
    }

    get template() {
        return {
            [this.cache.pk]: this.id,
            active: true,
            name: this.guild.name
        };
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