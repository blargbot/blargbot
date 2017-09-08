const DataBase = require('./DataBase');

class DataUser extends DataBase {
    constructor(client, id, user) {
        super(client, id, client.models.User);
        this.user = user || this.client.users.get(this.id);
    }

    get template() {
        return {
            userId: this.id,
            discriminator: this.user.discriminator,
            username: this.user.username,
            variables: {},
            local: 'en_US'
        };
    }

    async updateUser() {
        let user = await this.getOrCreateObject();
        let save = false;
        if (user.get('avatarURL') !== this.user.avatarURL) {
            user.set('avatarURL', this.user.avatarURL);
            save = true;
        }
        if (this.user.username !== user.get('username')) {
            save = true;
            user.set('discriminator', this.user.discriminator);
            user.set('username', this.user.username);
            //obj.usernames.push({
            //    name: obj.username,
            //    date: _r.now()
            //});
        }
        if (save)
            await user.save();
    }

    async getLocale() {
        return await this.getKey('locale');
    }

    async setLocale(locale) {
        return await this.setKey('locale', locale);
    }

    async getVariable(name) {
        return (await this.getKey(`variables`) || {})[name];
    }

    async setVariable(name, value) {
        return await this.setKey(`variables.${name}`, value);
    }

    async getGamatoto() {
        return await this.getKey('gamatoto');
    }

    async setGamatoto(gamatoto) {
        return await this.setKey('gamatoto', gamatoto);
    }

    async getGamatotoStart() {
        return await this.getKey('gamatotoStart');
    }

    async setGamatotoStart(time = Date.now(), location) {
        if (location) await this.setKey('gamatotoLocation', location);
        return await this.setKey('gamatotoStart', time);
    }
    async getGamatotoLocation() {
        return await this.getKey('gamatotoLocation');
    }
    async getGamatotoXp() {
        return await this.getKey('gamatotoXp');
    }
    async setGamatotoXp(xp) {
        return await this.setKey('gamatotoXp', xp);
    }

}

module.exports = DataUser;