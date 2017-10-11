const TagResult = require('../TagResult');
const TagError = require('../TagError');
const TagArray = require('../TagArray');
const SubTagArg = require('../SubTagArg');

class TagBase {
    constructor(client, options = {}) {
        if (this.constructor === TagBase) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
        this.client = client;
        this.name = options.name || this.constructor.name.toLowerCase();
        /* Format:
        * {
        *   name: string,
        *   optional: boolean,
        *   repeat: boolean
        * }
        * */
        this.named = options.named === undefined ? true : options.named;
        this.args = options.args || [];
        this.minArgs = options.minArgs;
        this.maxArgs = options.maxArgs;

        this.ccommand = options.ccommand || false;
        this.requiresStaff = options.requiresStaff || false;

        this.TagResult = TagResult;
        this.TagError = TagError;
        this.TagArray = TagArray;

        this.array = options.array || false;

        this.permissions = options.permissions || false;
        this.keys = options.keys === undefined ? {} : options.keys;

        if (_config.beta && process.env.SHARD_ID == 0) {
            this._keys = [`${this.base}.desc`];
            if (options.keys) {
                for (const key in options.keys) {
                    this._keys.push(options.keys[key]);
                }
            }
            let temp;
            for (const key of this._keys) {
                temp = this.client.LocaleManager.localeList.en;
                let segments = key.split('.');
                for (let i = 0; i < segments.length; i++) {
                    if (temp[segments[i]]) {
                        temp = temp[segments[i]];
                        continue;
                    }
                    if (i === segments.length - 1)
                        temp[segments[i]] = '';
                    else temp[segments[i]] = {};
                    if (!this.client.localeDirty) this.client.localeDirty = true;
                    temp = temp[segments[i]];
                }
            }
        }
    }

    get implicit() {
        return true;
    }

    async getDescription(dest) {
        return await this.decode(dest, `${this.base}.desc`);
    }

    async getExampleIn(dest) {
        return await this.decode(dest, `${this.base}.example.in`);
    }

    async getExampleOut(dest) {
        return await this.decode(dest, `${this.base}.example.out`);
    }

    /**
     * Main execution of the tag, returning a TagResult
     * @param {TagContext} ctx The TagContext
     * @param {boolean} parseArgs Whether to parse args automatically. Set to false to parse manually.
     */
    async execute(ctx, argsBundle, parseArgs = true) {
        argsBundle.parsedArgs = {};
        let { args, named, parsedArgs } = argsBundle;
        if (named === true && this.named === false) {
            throw new TagError('error.tag.namedunsupported', {
                tag: this.name
            });
        }

        if (this.requiresStaff && !ctx.isAuthorStaff) throw new TagError('error.tag.authorstaff', {
            tag: this.name,
            author: ctx.client.users.get(ctx.author).fullName
        });
        if (this.permissions !== false && Array.isArray(this.permissions) && this.permissions.length > 0) {
            let botPerms = ctx.channel.permissionsOf(ctx.client.user.id);
            for (const permission of this.permissions) {
                if (!botPerms.has(permission))
                    throw new TagError('error.tag.noperms', {
                        tag: this.name,
                        perm: permission
                    });
            }
        }

        if (this.named) {
            let namedList = [];
            if (named) {
                for (const arg of args) {
                    if (arg instanceof SubTagArg) {
                        let name = (await ctx.processSub(arg.name)).join('').toLowerCase();
                        let value = arg.value;
                        namedList.push({ name, value });
                    }
                }
            } else {
                for (let i = 0; i < args.length; i++) {
                    let template = this.argList[i];
                    if (template)
                        if (template.repeat) {
                            let repeated = args.slice(i);
                            for (const arg of repeated)
                                namedList.push({ name: template.name, value: args[i] });
                        } else
                            namedList.push({ name: template.name, value: args[i] });
                }
            }

            for (const arg of this.argList) {
                if (!arg.optional) {
                    if (namedList.filter(n => n.name === arg.name).length === 0) {
                        this.throw('error.tag.missingarg', {
                            arg: arg.name,
                            tag: this.name
                        });
                    }
                }
            }
            for (const arg of namedList) {
                let value = parseArgs ? await ctx.processSub(arg.value) : arg.value;
                if (parsedArgs.hasOwnProperty(arg.name) && !Array.isArray(parsedArgs[arg.name])) {
                    parsedArgs[arg.name] = [parsedArgs[arg.name]];
                }
                if (parsedArgs.hasOwnProperty(arg.name)) {
                    parsedArgs[arg.name].push(value);
                } else parsedArgs[arg.name] = value;
            }
        } else {
            if (this.maxArgs && args.length > this.maxArgs)
                this.throw(ctx.client.Constants.TagError.TOO_MANY_ARGS, {
                    expected: this.maxArgs,
                    received: args.length
                });

            if (this.minArgs && args.length < this.minArgs)
                this.throw(ctx.client.Constants.TagError.TOO_FEW_ARGS, {
                    expected: this.minArgs,
                    received: args.length
                });

            if (parseArgs)
                for (let i = 0; i < args.length; i++) {
                    args[i] = await ctx.processSub(args[i]);
                }
        }
        const res = new TagResult();

        return res;
    }

    parseInt(str, arg, base = 10) {
        let num = parseInt(str, base);
        if (isNaN(num)) this.throw('error.tag.isnan', {
            arg, value: str
        });
        else return num;
    }
    parseFloat(str, arg, base = 10) {
        let num = parseFloat(str, base);
        if (isNaN(num)) this.throw('error.tag.isnan', {
            arg, value: str
        });
        else return num;
    }
    async loadArray(ctx, arg) {
        let arr;
        if (arg.length === 1 && arg[0] instanceof this.TagArray) {
            arr = arg[0];
        } else {
            arr = await new this.TagArray().load(ctx, arg.join(''));
        }
        return arr;
    }

    throw(key, args) {
        throw new TagError(key, args);
    }

    set args(args) {
        this.argList = args;
    }

    get args() {
        let output = '';
        for (const arg of this.argList) {
            if (arg.optional)
                output += `[${arg.name}]`;
            else output += `<${arg.name}>`;
            if (arg.repeat) output += '...';
            output += ' ';
        }
        return output;
    }

    get usage() {
        let output = '{' + this.name;
        let optionalCount = 0;
        for (const arg of this.argList) {
            if (arg.optional) {
                if (arg.nested) {
                    output += `[;${arg.name}`;
                    optionalCount++;
                } else output += `[;${arg.name}]`;
            } else if (optionalCount > 0) {
                output += ']'.repeat(optionalCount) + `;${arg.name}`;
                optionalCount = 0;
            } else output += `;${arg.name}`;
            if (arg.repeat) output += '...';
            output += ' ';
        }
        if (optionalCount > 0) {
            output += ']'.repeat(optionalCount);
        }
        return output + '}';
    }

    async decode(dest, key, args) {
        await this.client.Helpers.Message.decode(dest, key, args);
    }

    get base() {
        return `tag.${this.category}.${this.name}`;
    }

    serialize() {
        return {
            name: this.name,
            args: this.args,
            named: this.named,
            array: this.array,
            desc: `${this.base}.desc`,
            ccommand: this.ccommand,
            requiresStaff: this.requiresStaff,
            permissions: this.permissions,
            implicit: this.implicit,
            category: this.category
        };
    }

}

module.exports = TagBase;