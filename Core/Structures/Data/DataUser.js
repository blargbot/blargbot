const Base = require('./DataBase');

class DataUser extends Base {
    constructor(client, id, user) {
        super(client, id, 'User');
        this.user = user;
    }

    get template() {
        return {
            [this.cache.pk]: this.id,
            discriminator: this.user.discriminator,
            username: this.user.username
        };
    }

    async updateUser() {
        let obj = await this.getObject();
        obj.avatarURL = this.user.avatarURL;
        if (this.user.username != obj.username) {
            obj.discriminator = this.user.discriminator;
            obj.username = this.user.username;
            //obj.usernames.push({
            //    name: obj.username,
            //    date: _r.now()
            //});
        }
        await this.setObject(obj);
    }

    async getLocale() {
        return await this.getKey('locale');
    }

    async setLocale(locale) {
        return await this.setKey('locale', locale);
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

module.exports = DataUser;