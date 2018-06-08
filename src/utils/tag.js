/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:38
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-01 22:30:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const bbEngine = require('../structures/BBTagEngine');

bu.serializeTagArray = function (array, varName) {
    if (!varName)
        return JSON.stringify(array);

    let obj = {
        v: array,
        n: varName
    };
    return JSON.stringify(obj);
};

bu.deserializeTagArray = function (value) {
    let obj = null;
    try {
        // Try to parse out any 1...5 to the full expansion
        let expanded = value.replace(/(-?\d+)\.\.\.(-?\d+)/g, function (match, from, to) {
            from = parseInt(from);
            to = parseInt(to);
            let descending = from > to;
            let count = Math.abs(to - from) + 1;
            let offset = Math.min(from, to);
            let values = [...Array(count).keys()].map(e => e + offset);
            if (descending)
                values = values.reverse();
            return values.join(',');
        });
        obj = JSON.parse(expanded);
    } catch (err) {
        // failed with ... expansion, try again without expanding
        try {
           obj = JSON.parse(value);
        }
        catch (err) {}
    }
    if (obj === null)
        return null;
    if (Array.isArray(obj)) 
        obj = { v: obj };
    return { v: obj.v, n: obj.n };
};

bu.getArray = async function (context, arrName) {
    let obj = bu.deserializeTagArray(arrName);
    if (obj != null) return obj;
    try {
        let arr = await context.variables.get(arrName);
        if (arr != undefined)
            return { v: arr, n: arrName };
    } catch (err) {
        return undefined;
    }
};

bu.setVariable = async function (name, values, type, guildId) {
    let vars = values;
    let updateObj = {};
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
            for (const key in vars) {
                storedThing.ccommands[name].vars[key] = vars[key];
            }
            break;
        case bu.TagVariableType.TAGGUILD:
            updateObj.tagVars = vars;
            await r.table('guild').get(name).update(updateObj);
            storedThing = await bu.getGuild(name);
            if (!storedThing.tagVars) storedThing.tagVars = {};
            for (const key in vars) {
                storedThing.tagVars[key] = vars[key];
            }
            break;
        case bu.TagVariableType.GLOBAL:
            await r.table('vars').update({
                varname: 'tagVars',
                values
            });
            for (const key in vars) {
                bu.globalVars[key] = vars[key];

            }
            break;
        default:
            updateObj.vars = vars;
            await r.table(bu.TagVariableType.properties[type].table).get(name).update(updateObj);
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
            for (const key in vars) {
                storedThing.vars[key] = vars[key];
            }
            break;
    }
};

bu.getVariable = async function (name, key, type, guildId) {
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
            if (!storedThing.ccommands[name]) storedThing.ccommands[name] = {};
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

bu.tagVariableScopes = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. ' +
            'They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\n' +
            'This makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.',
        setter: async (context, values) =>
            await bu.setVariable(context.guild.id, values,
                context.isCC ? bu.TagVariableType.GUILD : bu.TagVariableType.TAGGUILD),
        getter: async (context, name) =>
            await bu.getVariable(context.guild.id, name,
                context.isCC ? bu.TagVariableType.GUILD : bu.TagVariableType.TAGGUILD)
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        setter: async (context, values) => {
            if (context.author)
                return await bu.setVariable(context.author, values, bu.TagVariableType.AUTHOR);
            return bbEngine.addError({}, context, '`No author found`');
        },
        getter: async (context, name) => {
            if (context.author)
                return await bu.getVariable(context.author, name, bu.TagVariableType.AUTHOR);
            return bbEngine.addError({}, context, '`No author found`');
        }
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.',
        setter: async (context, values) =>
            await bu.setVariable(undefined, values, bu.TagVariableType.GLOBAL),
        getter: async (context, name) =>
            await bu.getVariable(undefined, name, bu.TagVariableType.GLOBAL)
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: async (context, values) => { return ''; }, //Temporary is never persisted to the database
        getter: async (context, name) => { } //Temporary is never persisted to the database
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        setter: async (context, values) => {
            if (context.isCC)
                return await bu.setVariable(context.tagName, values, bu.TagVariableType.GUILDLOCAL, context.guild.id);
            return await bu.setVariable(context.tagName, values, bu.TagVariableType.LOCAL);
        },
        getter: async (context, name) => {
            if (context.isCC)
                return await bu.getVariable(context.tagName, name, bu.TagVariableType.GUILDLOCAL, context.guild.id);
            return await bu.getVariable(context.tagName, name, bu.TagVariableType.LOCAL);
        }
    }
];
