class DataBase {

    constructor(client, id, cacheName) {
        this.client = client;
        this.id = id;
        this.cache = this.client.cache[cacheName];
        this.temp = {};
    }

    get template() {
        return { [this.cache.pk]: this.id };
    }

    async create() {
        return await this.setObject(this.template);
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

module.exports = DataBase;