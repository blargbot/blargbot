const Context = require('../Structures/Context');
const BaseHelper = require('./BaseHelper');

const Eris = require('eris');
const moment = require('moment');

class EmbedError extends Error {
    constructor(message, embed) {
        super(message);
        this.name = this.constuctor.name;
        this.embed = embed;
    }
}

class Embed {
    constructor(client, ctx, strict = false, autoValidate = false) {
        this.ctx = ctx;
        this.client = client;
        this.embed = {};
        this.content = '';
        this.strict = strict;
        this.autoValidate = autoValidate;
    }

    addField(name, value, inline = true) {
        if (!this.embed.fields) this.embed.fields = [];
        this.embed.fields.push({
            name: this.limit(name, 256),
            value: this.limit(value, 1024),
            inline
        });
        return this;
    }

    setTitle(title) {
        this.embed.title = this.limit(title, 256);
        return this;
    }

    setDescription(description) {
        this.embed.description = this.limit(description, 2048);
        return this;
    }

    setColor(color) {
        if (typeof color === 'string') {
            color = parseInt(color.replace(/[^\da-f]/gi, ''), 16);
        }
        this.embed.color = color;
        return this;
    }

    setUserAuthor(unresolvedUser) {
        return this.setUser(unresolvedUser, this.setAuthor);
    }

    setUserFooter(unresolvedUser) {
        return this.setUser(unresolvedUser, this.setFooter);
    }

    setUser(unresolvedUser, func) {
        let icon, name;
        if (!unresolvedUser) {
            name = this.ctx.author.fullNameId;
            icon = this.ctx.dynamicAvatarURL('webp', 128);
        } else {
            const { user } = this.client.Helpers.Resolve.generic(user);
            name = user.fullNameId;
            icon = user.dynamicAvatarURL('webp', 128);
        }
        return func(name, icon);
    }

    setAuthor(name, icon_url) {
        this.embed.author = {
            name: this.limit(name, 256), icon_url
        };
        return this;
    }

    setFooter(text, icon_url) {
        this.embed.footer = {
            text: this.limit(text, 2048), icon_url
        };
        return this;
    }

    setImage(url) {
        this.embed.image = { url };
        return this;
    }

    setThumbnail(url) {
        this.embed.thumbnail = { url };
        return this;
    }

    setTimestamp(time) {
        this.embed.timestamp = moment(time);
        return this;
    }

    setUrl(url) {
        this.embed.url = url;
        return this;
    }

    setRaw(raw = {}) {
        for (const key of Object.keys(raw)) {
            if (raw[key] === null) {
                delete this.embed[key];
            } else this.embed[key] = raw[key];
        }
        return this;
    }

    setContent(content) {
        this.content = this.limit(content, 2000);
    }

    get raw() {
        return { content: this.content, embed: this.embed };
    }

    validate() {
        if (this.embed.fields.length > 25) throw new EmbedError('Cannot have more than 25 fields', this.embed);
        let total = this.total;
        if (this.total > 5488) throw new EmbedError('Cannot be more than 4000 characters in total', this.embed);
    }

    get total() {
        return this.count();
    }

    count(obj = this.embed) {
        let total = 0;
        for (const value of Object.values(obj)) {
            if (typeof value == 'string')
                total += value.length;
            else if (Array.isArray(value)) {
                for (const value2 of value) {
                    total += value.name.length * 2;
                }
            } else if (typeof value == 'object') {
                total += this.count(value);
            }
        }
        return total;
    }

    limit(value, limit) {
        if (value.length > limit) {
            if (!this.strict) {
                value = value.substring(0, limit - 4) + ' ...';
            } else throw new EmbedError(`Value '${value}' cannot exceed ${limit} in strict mode. Length: ${value.length}`, this.embed);
        }
        if (this.autoValidate) this.validate();
        return value;
    }

    async send(dest) {
        this.validate();
        if (!dest) return await this.ctx.send(this.raw);
        else return await this.client.Helpers.Message.send(dest, this.raw);
    }
}

class EmbedBuilder extends BaseHelper {
    constructor(client) {
        super(client);
    }

    build(ctx) {
        return new Embed(this.client, ctx);
    }
}


module.exports = EmbedBuilder;