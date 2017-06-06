const DataBase = require('./DataBase');

class DataGuild extends DataBase {
    constructor(client, id, guild) {
        super(client, id, client.models.Guild);
        this.guild = guild || this.client.guilds.get(this.id);
    }

    get template() {
        return {
            guildId: this.id,
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
        return (await this.getKey(`variables`) || {})[name];
    }

    async setVariable(name, value) {
        return await this.setKey(`variables.${name}`, value);
    }

    async setTagVariable(name, value) {
        return await this.setKey(`tagVariables.${name}`, value);
    }

    async getTagVariable(name) {
        return (await this.getKey(`tagVariables`) || {})[name];
    }

}

module.exports = DataGuild;