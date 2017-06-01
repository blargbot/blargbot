const Context = require('../Structures/Context');
const BaseHelper = require('./BaseHelper');

const Eris = require('eris');
const moment = require('moment');

class MenuError extends Error {
    constructor(message, embed) {
        super(message);
        this.name = this.constuctor.name;
        this.embed = embed;
    }
}

class Menu {
    constructor(client, ctx) {
        this.ctx = ctx;
        this.client = client;
        this.embed = {};
        this.content = '';

        this.embed = this.client.Helpers.EmbedBuilder.build(this.ctx);
    }

    async send(dest) {
        if (!dest) return await this.ctx.send(this.raw);
        else return await this.client.Helpers.Message.send(dest, this.raw);
    }
}

class MenuBuilder extends BaseHelper {
    constructor(client) {
        super(client);
    }

    build(ctx) {
        return new Menu(this.client, ctx);
    }
}


module.exports = MenuBuilder;