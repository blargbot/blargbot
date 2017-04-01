class DataBase {

    constructor(id, cacheName) {
        this.id = id;
        this.cache = _cache[cacheName];
        this.temp = {};
        this.template = { [this.cache.pk]: this.id };
    }

    async create() {
        return await this.setObject(this.temp);
    }

    getTemp(key) {
        return this.temp[key];
    }

    setTemp(key, data) {
        this.temp[key] = data;
    }

    async saveTemp() {
        await this.setObject(this.temp);
        this.temp = {};
    }

    async getObject() {
        return await this.cache.get(this.id);
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

module.exports = DataBase;