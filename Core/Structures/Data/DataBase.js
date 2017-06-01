class DataBase {
    constructor(client, id, model = null) {
        this.client = client;
        this.id = id;
        this.model = model;
        client.Data[this.constructor.name.replace('Data', '')][id] = this;

        this.object = null;
    }

    get template() {
        return {};
    }

    async create(args) {
        let template = this.template;
        for (const key in args)
            template[key] = args[key];
        await this.model.upsert(template);
        return await this.getObject();
    }

    async setObject(data) {
        if (this.model === null) throw new Error('Model not set for ' + this.constructor.name);
        let obj = await this.getObject();
        if (obj) {
            for (const key in data) {
                obj.set(key, data[key]);
            }
            await obj.save();
            return obj;
        }
    }

    async getOrCreateObject() {
        let obj = await this.getObject();
        if (!obj) obj = await this.create();
        return obj;
    }

    async reloadObject() {
        if (this.object === null) this.object = await this.model.findById(this.id);
        else this.object = await this.object.reload();
    }

    async getObject() {
        await this.reloadObject();
        return this.object;
    }

    async saveTemp() {
        await this.setObject(this.temp);
        this.temp = {};
    }

    async getKey(key) {
        const obj = await this.getObject();
        if (obj) return obj.get(key);
    }

    async setKey(key, data = null) {
        let obj = await this.getObject();
        if (obj) {
            if (data === null)
                obj.set(key, undefined);
            else
                obj.set(key, data);
            await obj.save();
        }
        return this;
    }
}

module.exports = DataBase;