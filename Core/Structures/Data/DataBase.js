class DataBase {
    constructor(client, id, model = null) {
        this.client = client;
        this.id = id;
        this.model = model;
        this.temp = {};
        client.Data[this.constructor.name.replace('Data', '')][id] = this;
    }

    get template() {
        return {};
    }

    async create() {
        return await this.setObject(this.template);
    }

    async setObject(data) {
        if (this.model === null) throw new Error('Model not set for ' + this.constructor.name);
        return await this.model.upsert(data);
    }

    async getObject() {
        return await this.model.findById(this.id);
    }

    async saveTemp() {
        await this.setObject(this.temp);
        this.temp = {};
    }

    async getKey(key) {
        return (await this.getObject())[key];
    }

    async setKey(key, data = null) {
        let obj = await this.getObject();
        if (data === null)
            delete obj[key];
        else
            obj[key] = data;
        this.setObject(obj);
    }
}

module.exports = DataBase;