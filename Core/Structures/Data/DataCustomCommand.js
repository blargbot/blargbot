const Base = require('./DataBase');

class DataCustomCommand extends Base {
    constructor(client, id, guildId) {
        super(client, id, 'Guild');
        this.guildId = guildId;

        this.template = {
            [this.cache.pk]: this.id,
            content: '',
            author: ''
        };
    }

    async getObject() {
        return (await this.cache.get(this.guildId)).ccommands[this.id];
    }

    async setObject(data) {
        return await this.cache.set(this.guildId, {
            ccommands: {
                [this.id]: data
            }
        });
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
        let newStored = (await this.cache.get(this.guildId)).ccommands[id];
        if (newStored != undefined) throw new Error('Entry already exists');
        await this.setObject(_r.literal(undefined));
        stored[this.cache.pk] = id;
        this.id = id;
        await this.setObject(stored);
    }

    async setContent(content) {
        return await this.setObject({
            content,
            lastmodified: _r.now()
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
            lastuse: _r.now()
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