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

    async create() {
        return await this.setObject(this.template);
    }

    async getObject() {
        let obj = await this.cache.get(this.id);
        if (!obj) return await this.create();
        else return obj;
    }

    async setObject(data) {
        return await this.cache.set(this.id, data);
    }

    async getKey(key) {
        return (await this.getObject())[key];
    }

    async setKey(key, data) {
        return await this.setObject({
            [key]: data
        });
    }
}

module.exports = DataCacheBase;