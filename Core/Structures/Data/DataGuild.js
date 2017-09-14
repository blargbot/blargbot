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

    async getPrefixes() {
        return await this.getKey('prefixes');
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

    async getModlogChannels() {
        return await this.client.models.GuildModlogChannel.findAll({
            where: {
                guildId: this.guild.id
            }
        });
    }

    async getModlogChannel(type) {
        let channels = await this.client.models.GuildModlogChannel.findAll({
            where: {
                guildId: this.guild.id,
                type
            }
        });
        let channel;
        if (channels.length > 0) {
            channel = this.client.getChannel(await channels[0].get('channel'));
        } else if (type !== 'default') {
            channel = await this.getModlogChannel('default');
        } else channel = null;
        return channel;
    }

    async setModlogChannel(type, channel) {
        return await this.client.models.GuildModlogChannel.upsert({
            type,
            channel,
            guildId: this.guild.id
        });
    }

    async removeModlogChannel(type) {
        return await this.client.models.GuildModlogChannel.destroy({
            where: {
                guildId: this.guild.id,
                type
            }
        });
    }

    async getModlog(caseId) {
        return await this.client.models.GuildModlog.find({
            where: {
                guildId: this.guild.id, caseId
            }
        });
    }

    async addModlog(moderatorId, type, reason, targets) {
        let model = await this.client.models.GuildModlog.create({
            guildId: this.guild.id,
            moderatorId, type, reason, targets
        });
        return model;
    }

}

module.exports = DataGuild;