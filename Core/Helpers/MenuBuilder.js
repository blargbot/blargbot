const Context = require('../Structures/Context');
const BaseHelper = require('./BaseHelper');
const EventEmitter = require('eventemitter3');

const Eris = require('eris');
const moment = require('moment');

class MenuError extends Error {
    constructor(message, embed) {
        super(message);
        this.name = this.constuctor.name;
        this.embed = embed;
    }
}

class Menu extends EventEmitter {
    constructor(client, ctx) {
        super();
        this.ctx = ctx;
        this.client = client;
        this.content = '';

        this.embed = this.client.Helpers.Embed.build(this.ctx);

        this.choices = [];

        this.strict = false;;
    }

    get emoteRegex() {
        return /<:.+:(\d{17,23})>/;
    }

    setStrict(bool = true) {
        this.strict = bool;
    }

    getEmoteId(emote) {
        if (this.emoteRegex.test(emote)) {
            emote = emote.match(this.emoteRegex)[0];
        }
        return emote;
    }

    addDecodeChoice(name, description, value, emote) {
        this.choices.push({
            name, description, emote, value,
            decode: true
        });
        emote = this.getEmoteId(emote);
        this.on(emote, (userId) => {
            this.emit('result', userId, value);
        });
        return this;
    }

    addChoice(name, description, value, emote) {
        this.choices.push({ name, description, value, emote });
        emote = this.getEmoteId(emote);
        this.on(emote, (userId) => {
            this.emit('result', userId, value);
        });
        return this;
    }

    addConfirm() {
        this.choices.push({ name: 'menu.confirm.name', description: 'menu.confirm.description', emote: '✅', decode: true });
        this.on('✅', (userId) => {
            this.emit('confirm', userId);
            this.close();
        });
        return this;
    }

    addCancel() {
        this.choices.push({ name: 'menu.cancel.name', description: 'menu.cancel.description', emote: '❌', decode: true });
        this.on('❌', (userId) => {
            this.emit('cancel', userId);
            this.close();
        });
        return this;
    }

    addPagination(pages) {
        this.choices.push({
            emote: '⬅'
        });
        this.on('⬅', (userId) => {
            this.emit('pageLeft', userId);
        });
        this.choices.push({
            emote: '➡'
        });
        this.on('➡', (userId) => {
            this.emit('pageRight', userId);
        });
        return this;
    }

    emit(event, userId, value) {
        if (this.client.user.id === userId) return;
        if (this.strict && this.ctx.author.id !== userId) return;
        super.emit(event, userId, value);
    }

    async send() {
        for (const choice of this.choices) {
            if (choice.decode) {
                choice.name = await this.ctx.decode(choice.name);
                choice.description = await this.ctx.decode(choice.description);
            }
            if (choice.name && choice.description)
                this.embed.addField(choice.name, choice.emote + ' ' + choice.description, true);
            if (choice.emote.startsWith('<'))
                choice.emote = choice.emote.substring(2, choice.emote.length - 1);
        }
        this.embed.setTitle('meow');
        this.msg = await this.embed.send();

        for (const emote of this.choices.map(c => c.emote)) {
            await this.msg.addReaction(emote);
        }

        if (!this.client.awaitedReactions[this.ctx.channel.id])
            this.client.awaitedReactions[this.ctx.channel.id] = {};
        this.client.awaitedReactions[this.ctx.channel.id][this.msg.id] = this;

        // Close menu after 10 minutes;
        this.timeout = setTimeout(this.close, 10 * 60 * 1000);

        return this;
    }

    close() {
        clearTimeout(this.timeout);
        this.removeAllListeners();
        if (this.msg)
            this.client.awaitedReactions[this.ctx.channel.id][this.msg.id] = undefined;
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