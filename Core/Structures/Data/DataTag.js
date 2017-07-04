const DataBase = require('./DataBase');

class DataTag extends DataBase {
    static stripTitle(title) {
        return title.replace(/[^\w\d_!\.+-=\^\$\?"':;# ]/gim, '');
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
            content
        });
    }

    async getAuthor() {
        return await this.getKey('authorId');
    }

    async setAuthor(authorId) {
        return await this.setKey('authorId', authorId);
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
            lastUsed: Date.now()
        });
    }

    async getFavourites() {
        return await this.getKey('favourites');
    }

    async addFavourite(userId) {
        return await this.client.models.TagFavourite.upsert({
            tagName: this.id,
            userId
        });
    }

    async removeFavourite(userId) {
        let fav = await this.client.models.TagFavourite.findAll({
            tagName: this.id,
            userId
        });
        return await fav.destroy();
    }

    async getVariable(name) {
        return (await this.getKey(`variables`) || {})[name];
    }

    async setVariable(name, value) {
        return await this.setKey(`variables.${name}`, value);
    }

    async getUsage() {
        return await this.getKey('usage');
    }

    async setUsage(value) {
        this.setKey('usage', value);
    }

    async getDesc() {
        return await this.getKey('desc');
    }

    async setDesc(value) {
        return await this.setKey('desc', value);
    }
}

module.exports = DataTag;