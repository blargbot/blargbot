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
    get isStaff() { return this['_isStaff'] || (this['_isStaff'] = bu.isUserStaff(this.authorizer, this.guild.id)); }
    get author() { return this._author || this.guild.id; }
    get authorizer() { return this._authorizer || this.author; }

    /**
     * Creates a new BBTagExecContext instance
     * @param {runArgs} options The message that this context is regarding
     * @param {Context} parent The parent scope to initialize this one from
     */
    constructor(options) {
        this.message = this.msg = options.msg;
        if (Array.isArray(options.input)) {
            this.input = options.input;
        } else {
            this.input = bu.splitInput(options.input || '');
            if (this.input.length == 1 && this.input[0] == '')
                this.input = [];
        }

        let flags = Array.isArray(options.flags) ? options.flags : [];
        this.flaggedInput = bu.parseInput(flags, [].concat([''], this.input));
        this.flaggedInput._ = this.flaggedInput.undefined;
        this.flaggedInput.undefined = undefined;
        for (const key in this.flaggedInput)
            if (Array.isArray(this.flaggedInput[key]))
                this.flaggedInput[key] = this.flaggedInput[key].join(' ');
        this.isCC = options.isCC;
        this.tagVars = options.tagVars;
        this._author = options.author;
        this._authorizer = options.authorizer;
        this.tagName = options.tagName;
        this.cooldown = options.cooldown;
        this.locks = options.locks || {};
        this.outputModify = options.outputModify || ((_, r) => r);

        if (!cooldowns[this.msg.guild.id])
            cooldowns[this.msg.guild.id] = {};
        if (!cooldowns[this.msg.guild.id][this.isCC])
            cooldowns[this.msg.guild.id][this.isCC] = {};
        if (!cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id])
            cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id] = {};
        this.cooldowns = cooldowns[this.msg.guild.id][this.isCC][this.msg.author.id];
        this._cooldowns = cooldowns;

        // prevents output
        this.silent = options.silent;

        /** @type {bbError[]} */
        this.errors = [];
        this.debug = [];
        this.scopes = new ScopeCollection();
        this.variables = new VariableCache(this);
        this.execTimer = new Timer();
        this.dbTimer = new Timer();
        this.dbObjectsCommitted = 0;
        this.state = {
            /** @type {{[key:string]: limit}} */
            limits: options.limits || {},
            query: {
                count: 0,
                user: {},
                role: {}
            },
            outputMessage: null,
            ownedMsgs: [],
            return: 0,
            stackSize: 0,
            embed: null,
            file: null,
            reactions: [],
            nsfw: null,
            /** @type {{regex: RegExp|string, with: string}} */
            replace: null,
            break: 0,
            continue: 0,
            subtags: {},
            overrides: {},
            cache: {},
            safeLoops: 0,
            allowedMentions: {
                users: [],
                roles: [],
                everybody: false
            }
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
        if (options.outputModify === undefined) options.outputModify = this.outputModify;

        let context = new Context(options, this);
        context.state = this.state;
        context.scopes = this.scopes;
        context.variables = this.variables;

        return context;
    }

    async getUser(name, args) {
        let didSend = false;
        if (this.state.query.count >= 5)
            args.quiet = args.suppress = true;
        if (args.onSendCallback)
            args.onSendCallback = ((oldCallback) => () => (didSend = true, oldCallback()))(args.onSendCallback);
        else
            args.onSendCallback = () => didSend = true;

        if (name in this.state.query.user) {
            let user = bot.users.get(this.state.query.user[name]);
            if (user) return user;
            name = this.state.query.user[name];
        }

        let result;
        try {
            result = await bu.getUser(this.msg, name, args);
        } finally { }
        if (didSend)
            this.state.query.count++;
        this.state.query.user[name] = (result || { id: undefined }).id;
        return result;
    }

    async getRole(name, args) {
        let didSend = false;
        if (this.state.query.count >= 5)
            args.quiet = args.suppress = true;
        if (args.onSendCallback)
            args.onSendCallback = ((oldCallback) => () => (didSend = true, oldCallback()))(args.onSendCallback);
        else
            args.onSendCallback = () => didSend = true;

        if (name in this.state.query.role)
            return bot.guilds.get(this.guild.id).roles.get(this.state.query.role[name]);

        let result;
        try {
            result = await bu.getRole(this.msg, name, args);
        } finally { }
        if (didSend)
            this.state.query.count++;
        this.state.query.role[name] = (result || { id: undefined }).id;
        return result;
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
        if (this.silent) return this.state.outputMessage;
        if (!this.state.outputMessage) {
            this.state.outputMessage = new Promise(async function (resolve, reject) {
                try {
                    let disableEveryone = true;
                    if (this.isCC) {
                        let s = await r.table('guild').get(this.msg.guild.id);
                        disableEveryone = s.settings.disableeveryone === true || !this.state.allowedMentions.everybody;

                        console.log('Allowed mentions:', this.state.allowedMentions, disableEveryone);
                    }
                    let response = await bu.send(this.msg,
                        {
                            content: this.outputModify(this, text),
                            embed: this.state.embed,
                            nsfw: this.state.nsfw,
                            allowedMentions: {
                                everyone: !disableEveryone,
                                roles: !!this.isCC ? this.state.allowedMentions.roles : false,
                                users: !!this.isCC ? this.state.allowedMentions.users : false
                            }
                        }, files || this.state.file);

                    if (response && response.channel) {
                        await bu.addReactions(response.channel.id, response.id, [...new Set(this.state.reactions)]);
                        this.state.ownedMsgs.push(response.id);
                        resolve(response.id);
                        this.state.outputMessage = response.id;
                    } else {
                        if (response instanceof Error) {
                            if (response.message !== 'No content') {
                                reject(response);
                            } else {
                                resolve();
                            }
                        } else {
                            reject(new Error('Failed to send: ' + text + ' ' + response));
                        }
                    }
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
        let result = new Context({
            msg,
            isCC: obj.isCC,
            tagName: obj.tagName,
            author: obj.author,
            authorizer: obj.authorizer
        });
        result.scopes._scopes = [obj.scope];
        result.state = Object.assign({}, result.state, obj.state);
        result.input = obj.input;

        result.state.cache = {};
        result.state.overrides = {};

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
            authorizer: this.authorizer,
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

/**
 * @typedef {Object} limit
 * @property {number} [limit.count] The remaining uses a subtag has. Leave undefined for unlimited
 * @property {string} [limit.check] The function name inside the engine.checks property to use as a check
 * @property {boolean} [limit.disabled] The subtag is disabled and cannot be used at all
 * @property {boolean} [limit.staff] The context.isStaff promise must return true
 */
