const DataBase = require('./DataBase');

class DataTag extends DataBase {
    static stripTitle(title) {
        return title.replace(/[^\d\w\.,!#\$\/?"':;\[\]&%*()-_=+ ]/gi, '');
    }

    constructor(client, id, strip = true) {
        id = DataTag.stripTitle(id);
        super(client, id, client.models.Tag);
    }

    get template() {
        return {
            tagName: this.id,
            content: '',
            favourites: 0,
            lastUsed: Date.now(),
            uses: 0,
            variables: {},
            authorId: 0
        };
    }

    async create(args) {
        if (args.tagName)
            args.tagName = DataTag.stripTitle(args.tagName);
        return await super.create(args);
    }

    async getAuthor() {
        return await this.getKey('authorId');
    }

    async setAuthor(id) {
        return await this.setKey('authorId', id);
    }

    async getContent() {
        return await this.getKey('content');
    }

    async rename(id) {
        id = DataTag.stripTitle(id);
        let obj = await this.getObject(id);
        obj.set('tagName', id);
        await obj.save();
        this.id = id;
        return obj;
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
        return (await this.getKey(`variables`) || {})[name];
    }

    async setVariable(name, value) {
        return await this.setKey(`variables.${name}`, value);
    }

}

module.exports = DataTag;