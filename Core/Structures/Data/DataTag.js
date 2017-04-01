const Base = require('./DataBase');

class DataUser extends Base {
    constructor(id) {
        super(id, 'Tag');

        this.template = {
            [this.cache.pk]: this.id,
            content: '',
            favourites: 0,
            lastmodified: _r.now(),
            lastuse: _r.now(),
            uses: 0,
            vars: {},
            author: ''
        };
    }

    async getAuthor() {
        return await this.getKey('author');
    }

    async setAuthor(id) {
        return await this.setKey('author', id);
    }

    async getContent() {
        return await this.getKey('content');
    }

    async rename(id) {
        await this.cache.rename(this.id, id);
        this.id = id;
    }

    async setContent(content) {
        return await this.setObject({
            content,
            lastmodified: _r.now()
        });
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
            lastuse: _r.now()
        });
    }

    async getFavourites() {
        return await this.getKey('favourites');
    }

    async setFavourites(count) {
        return await this.setKey('favourites', count);
    }

    async incrementFavourites() {
        return await this.setKey('favourites', (await this.getFavourites()) + 1);
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