const TagResult = require('./TagResult');

class Tag {

    constructor(options) {
        if (this.constructor === Tag) {
            throw new Error('Can\'t instantiate an abstract class!');
        }
        if (!options) options = {};
        this.category = options.category || bu.TagType.COMPLEX;
        this.name = options.name || this.constructor.name.toLowerCase();
        this.args = options.args || [];
        this.desc = options.desc || '';
        this.exampleIn = options.exampleIn || `This is a tag: {${this.name}}`;
        this.exampleOut = options.exampleOut || 'This is a tag:';
        this.array = options.array || false;
    }

    async execute(ctx, parseArgs) {
        if (parseArgs)
            for (let i = 1; i < ctx.args.length; i++) {
            //    params.args[i] = await bu.processTagInner(params, i);
            }

        return new TagResult(ctx);
    }

    set args(args) {
        this.argList = args;
    }

    get args() {
        let output = '';
        for (const arg of this.argList) {
            if (arg.optional)
                output += `[${arg.name}]`;
            else output += `&lt;${arg.name}&gt;`;
            if (arg.repeat) output += '...';
            output += ' ';
        }
        return output;
    }
    get usage() {
        let output = '{name';
        let optionalCount = 0;
        for (const arg of this.argList) {
            if (arg.optional) {
                output += `[;${arg.name}`;
                optionalCount++;
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

    serializeArray(array, varName) {
        if (!varName)
            return JSON.stringify(array);

        let obj = {
            v: array,
            n: varName
        };
        return JSON.stringify(obj);
    }

    deserializeArray(value) {
        try {
            let obj = JSON.parse(value
                .replace(new RegExp(bu.specialCharBegin + 'LB' + bu.specialCharEnd, "g"), '{')
                .replace(new RegExp(bu.specialCharBegin + 'RB' + bu.specialCharEnd, "g"), '}'));
            if (Array.isArray(obj)) obj = {
                v: obj
            };
            return obj;
        } catch (err) {
            return null;
        }
    }

    async getArray(params, arrName, getVar = true) {
        let obj = this.deserializeArray(arrName);
        if (!obj && getVar) {
            try {
                let arr = await TagManager.list['get'].getVar(params, arrName);
                if (arr != undefined) {
                    obj = bu.deserializeTagArray(bu.serializeTagArray(arr, arrName));
                }
            } catch (err) {
                return undefined;
            }
        }
        return obj;
    }

    async setArray(params, deserialized) {
        await TagManager.list['set'].setVar(params, deserialized.n, deserialized.v);
    }

    async setVariable(name, key, value, type, guildId) {
        let vars = {};
        let updateObj = {};
        vars[key] = value;
        let storedThing;

        switch (type) {
            case bu.TagVariableType.GUILDLOCAL:
                updateObj.ccommands = {};
                updateObj.ccommands[name] = {};
                updateObj.ccommands[name].vars = vars;
                await r.table('guild').get(guildId).update(updateObj);
                storedThing = await bu.getGuild(guildId);
                if (!storedThing.ccommands) storedThing.ccommands = {};
                if (!storedThing.ccommands[name]) storedThing.ccommands[name] = {};
                if (!storedThing.ccommands[name].vars) storedThing.ccommands[name].vars = {};
                storedThing.ccommands[name].vars[key] = value;
                break;
            case bu.TagVariableType.TAGGUILD:
                updateObj.tagVars = vars;
                await r.table('guild').get(name).update(updateObj);
                storedThing = await bu.getGuild(name);
                if (!storedThing.tagVars) storedThing.tagVars = {};
                storedThing.tagVars[key] = value;
                break;
            case bu.TagVariableType.GLOBAL:
                let values = vars;
                await r.table('vars').update({
                    varname: 'tagVars',
                    values
                });
                bu.globalVars[key] = value;
                break;
            default:
                updateObj.vars = vars;
                await r.table(bu.TagVariableType.properties[type].table).get(name).update(updateObj).run();
                switch (type) {
                    case bu.TagVariableType.GUILD:
                        storedThing = await bu.getGuild(name);
                        break;
                    case bu.TagVariableType.LOCAL:
                        storedThing = await bu.getCachedTag(name);
                        break;
                    case bu.TagVariableType.AUTHOR:
                        storedThing = await bu.getCachedUser(name);
                        break;
                }
                if (!storedThing.vars) storedThing.vars = {};
                storedThing.vars[key] = value;
                break;
        }
    };

    async getVariable(name, key, type, guildId) {
        let storedThing;
        let returnVar;
        switch (type) {
            case bu.TagVariableType.GUILD:
                storedThing = await bu.getGuild(name);
                if (!storedThing.vars) storedThing.vars = {};
                returnVar = storedThing.vars[key];
                break;
            case bu.TagVariableType.GUILDLOCAL:
                storedThing = await bu.getGuild(guildId);

                if (!storedThing.ccommands[name].vars) storedThing.ccommands[name].vars = {};
                returnVar = storedThing.ccommands[name].vars[key];
                break;
            case bu.TagVariableType.TAGGUILD:
                storedThing = await bu.getGuild(name);
                if (!storedThing.tagVars) storedThing.tagVars = {};
                returnVar = storedThing.tagVars[key];
                break;
            case bu.TagVariableType.AUTHOR:
                storedThing = await bu.getCachedUser(name);
                if (!storedThing.vars) storedThing.vars = {};
                returnVar = storedThing.vars[key];
                break;
            case bu.TagVariableType.LOCAL:
                storedThing = await bu.getCachedTag(name);
                if (!storedThing.vars) storedThing.vars = {};
                returnVar = storedThing.vars[key];
                break;
            case bu.TagVariableType.GLOBAL:
                returnVar = await bu.getCachedGlobal(key);
                break;
            default:
                storedThing = await r.table(bu.TagVariableType.properties[type].table).get(name);
                if (!storedThing.vars)
                    storedThing.vars = {};
                returnVar = storedThing.vars[key];
                break;
        }
        return returnVar;
    };

    async getUser(msg, args, index) {
        var obtainedUser;
        if (!index) index = 1;

        msg.content = bu.processSpecial(msg.content);
        if (args.length == index) {
            obtainedUser = msg.author;
        } else {
            if (args[index + 1]) {
                obtainedUser = await bu.getUser(msg, args[index], true);
            } else {
                obtainedUser = await bu.getUser(msg, args[index]);
            }
        }
        return obtainedUser;
    };

    async processError(params, errormessage) {
        let fallback = params.fallback;
        let returnMessage = {};
        params.content = fallback;

        if (fallback === undefined) returnMessage.contents = errormessage;
        else returnMessage = await bu.processTag(params);
        if (returnMessage.terminate) params.terminate = true;
        return returnMessage.contents;
    };

}

module.exports = Tag;