const DataBase = require('./DataBase');

class DataCustomCommand extends DataBase {
    constructor(client, id, guildId) {
        super(client, id, client.models.GuildCustomCommand);
        this.guildId = guildId;
        this.guild = this.client.getDataGuild(guildId);

        this.template = {
            [this.cache.pk]: this.id,
            content: '',
            author: ''
        };
    }

    async getAuthor() {
        return await this.getKey('author');
    }

    async setAuthor(id) {
        return await this.setKey('author', id);
    }

    async getContent() {
        return await this.getKey('content');
    }

    async rename(id) {
        let stored = await this.getObject();
        // TODO: rename
        await this.setObject(stored);
    }

    async setContent(content) {
        return await this.setObject({
            content,
            lastmodified: Date.now()
        });
    }

    async getUses() {
        return await this.getKey('uses');
    }

    async setUses(uses) {
        return await this.setKey('uses', uses);
    }

    async incrementUses() {
        return await this.setObject({
            uses: (await this.getUses()) + 1,
            lastuse: Date.now()
        });
    }

    async getFavourites() {
        return await this.getKey('favourites');
    }

    async setFavourites(count) {
        return await this.setKey('favourites', count);
    }

    async incrementFavourites() {
        return await this.setKey('favourites', (await this.getFavourites()) + 1);
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

module.exports = DataCustomCommand;