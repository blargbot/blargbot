const Base = require('./DataBase');

class DataUser extends Base {
    constructor(id) {
        super(id, 'User');
    }

    async updateUser(user) {
        let obj = await this.getObject();
        obj.avatarURL = user.avatarURL;
        if (user.username != obj.username) {
            obj.discriminator = user.discriminator;
            obj.username = user.username;
            obj.usernames.push({
                name: obj.username,
                date: _r.now()
            });
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