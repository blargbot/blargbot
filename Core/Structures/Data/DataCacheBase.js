const DataBase = require('./DataBase');

class DataCacheBase extends DataBase {

    constructor(client, id, cacheName) {
        super(client, id);
        this.client = client;
        this.id = id;
        this.cache = this.client.cache[cacheName];
    }

    get template() {
        return { [this.cache.pk]: this.id };
    }

    async create(args = {}) {
        let template = this.template;
        for (const key in args)
            template[key] = args[key];
        await this.setObject(template);
        return await this.getObject();
    }

    async getOrCreateObject(args) {
        let obj = await this.cache.get(this.id);
        if (!obj) return await this.create(args);
        else return obj;
    }

    async getObject() {
        return await this.cache.get(this.id);
    }

    async setObject(datum = {}) {
        return await this.cache.set(this.id, datum);
    }
}

module.exports = DataCacheBase;