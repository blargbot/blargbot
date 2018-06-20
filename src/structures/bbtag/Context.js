'use strict';

const ScopeCollection = require('./Scope');
const Timer = require('../Timer');
const { VariableCache, CacheEntry } = require('./Caching');
const ReadWriteLock = require('rwlock');

// stores cooldown values per-guild-per-tag-per-user
const cooldowns = {};

function serializeEntity(entity) {
    return { id: entity.id, serialized: JSON.stringify(entity) };
}

class Context {
    get totalDuration() { return this.execTimer.duration.add(this.dbTimer.duration); }
    get channel() { return this.message.channel; }
    get member() { return this.message.member; }
    get guild() { return this.message.channel.guild; }
    get user() { return this.message.author; }
    get scope() { return this.scopes.local; }
    /** @type {Promise<boolean>} */
    get isStaff() { return this['_isStaff'] || (this['_isStaff'] = bu.isUserStaff(this.author, this.guild.id)); }
    get author() { return this._author || this.guild.id; }

    /**
     * Creates a new BBTagExecContext instance
     * @param {runArgs} options The message that this context is regarding
     * @param {Context} parent The parent scope to initialize this one from
     */
    constructor(options) {
        this.message = this.msg = options.msg;
        this.input = bu.splitInput(options.input || '');
        if (this.input.length == 1 && this.input[0] == '')
            this.input = [];

        let flags = Array.isArray(options.flags) ? options.flags : [];
        this.flaggedInput = bu.parseInput(flags, [].concat([''], this.input));
        this.flaggedInput._ = this.flaggedInput.undefined;
        this.flaggedInput.undefined = undefined;
        for (const key in this.flaggedInput)
            if (Array.isArray(this.flaggedInput[key]))
                this.flaggedInput[key] = this.flaggedInput[key].join(' ');
        this.isCC = options.isCC;
        this._author = options.author;
        this.tagName = options.tagName;
        this.cooldown = options.cooldown;
        this.locks = options.locks || {};

        if (!cooldowns[this.msg.guild.id])
            cooldowns[this.msg.guild.id] = {};
        if (!cooldowns[this.msg.guild.id][this.isCC])
            cooldowns[this.msg.guild.id][this.isCC] = {};
        if (!cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id])
            cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id] = {};
        this.cooldowns = cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id];
        this._cooldowns = cooldowns;

        /** @type {bbError[]} */
        this.errors = [];
        this.scopes = new ScopeCollection();
        this.variables = new VariableCache(this);
        this.execTimer = new Timer();
        this.dbTimer = new Timer();
        this.dbObjectsCommitted = 0;
        this.state = {
            count: {
                dm: 0,
                send: 0,
                edit: 0,
                delete: 0,
                react: 0, // Not implemented, potential for the future
                reactRemove: 0, // Not implemented, potential for the future
                timer: 0,
                loop: 0,
                foreach: 0
            },
            outputMessage: null,
            ownedMsgs: [],
            return: 0,
            stackSize: 0,
            embed: null,
            reactions: [],
            nsfw: null,
            /** @type {{regex: RegExp|string, with: string}} */
            replace: null,
            break: 0,
            continue: 0,
            subtags: {},
            overrides: {},
            cache: {}
        };
    }

    ownsMessage(messageId) {
        return messageId == this.msg.id || this.state.ownedMsgs.indexOf(messageId) != -1;
    }

    /**
     * @param {runArgs} options The option overrides to give to the new context
     */
    makeChild(options = {}) {
        if (options.msg === undefined) options.msg = this.msg;
        if (options.input === undefined) options.input = this.input;
        if (options.isCC === undefined) options.isCC = this.isCC;
        if (options.tagName === undefined) options.tagName = this.tagName;
        if (options.author === undefined) options.author = this.author;
        if (options.locks === undefined) options.locks = this.locks;

        let context = new Context(options, this);
        context.state = this.state;
        context.scopes = this.scopes;
        context.variables = this.variables;

        return context;
    }

    override(subtag, callback) {
        let overrides = this.state.overrides;
        let exists = overrides.hasOwnProperty(subtag);
        let previous = overrides[subtag];
        overrides[subtag] = callback;
        return {
            previous,
            revert() {
                if (!exists)
                    delete overrides[subtag];
                else
                    overrides[subtag] = previous;
            }
        };
    }

    getLock(key) {
        return this.locks[key] || (this.locks[key] = new ReadWriteLock());
    }

    async sendOutput(text, files) {
        if (!this.state.outputMessage) {
            this.state.outputMessage = new Promise(async function (resolve, reject) {
                try {
                    let disableEveryone = true;
                    if (this.isCC) {
                        let s = await r.table('guild').get(this.msg.guild.id);
                        disableEveryone = s.settings.disableeveryone === true;
                    }
                    let response = await bu.send(this.msg,
                        {
                            content: text,
                            embed: this.state.embed,
                            nsfw: this.state.nsfw,
                            disableEveryone: disableEveryone
                        }, files);

                    if (response != null && response.channel != null)
                        await bu.addReactions(response.channel.id, response.id, [...new Set(this.state.reactions)]);
                    this.state.ownedMsgs.push(response.id);
                    resolve(response.id);
                    this.state.outputMessage = response.id;
                } catch (err) {
                    reject(err);
                }
            }.bind(this));
        };
        return await this.state.outputMessage;
    }

    getCached(key, getIfNotSet) {
        if (this.state.cache.hasOwnProperty(key))
            return this.state.cache[key];
        return this.state.cache[key] = getIfNotSet(key);
    }

    static async deserialize(obj) {
        let msg;
        try {
            msg = await bot.getMessage(obj.msg.channel.id, obj.msg.id);
        } catch (err) {
            let channel = (await bot.getChannel(obj.msg.channel.id));
            let member;
            if (channel == null) {
                channel = JSON.parse(obj.msg.channel.serialized);
                member = JSON.parse(obj.msg.member.serialized);
            }
            else
                member = channel.guild.members.get(obj.msg.member.id) || JSON.parse(obj.msg.member.serialized);
            msg = {
                id: obj.msg.id,
                timestamp: obj.msg.timestamp,
                content: obj.msg.content,
                channel,
                member,
                guild: channel.guild,
                author: member.user,
                attachments: obj.msg.attachments,
                embeds: obj.msg.embeds
            };
        }
        let result = new Context({ msg, isCC: obj.isCC, tagName: obj.tagName, author: obj.author });
        result.scopes._scopes = [obj.scope];
        result.state = obj.state;
        result.input = obj.input;

        for (const key of Object.keys(obj.tempVars || {}))
            result.variables.cache[key] = new CacheEntry(result, key, obj.tempVars[key]);
        return result;
    }

    serialize() {
        let result = {
            msg: {
                id: this.message.id,
                timestamp: this.message.timestamp,
                content: this.message.content,
                channel: serializeEntity(this.channel),
                member: serializeEntity(this.member),
                attachments: this.message.attachments,
                embeds: this.message.embeds
            },
            isCC: this.isCC,
            state: Object.assign({}, this.state),
            scope: Object.assign({}, this.scope),
            input: this.input,
            flaggedInput: this.flaggedInput,
            tagName: this.tagName,
            author: this.author,
            tempVars: this.variables.list
                .filter(v => v.key.startsWith('~'))
                .reduce((p, v) => {
                    p[v.key] = v.value;
                    return p;
                }, {})
        };
        delete result.state.cache;
        delete result.state.overrides;
        return result;
    }
}

module.exports = Context;