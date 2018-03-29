/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:38
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-22 09:43:58
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
    try {
        let obj = JSON.parse(value);
        if (Array.isArray(obj)) obj = {
            v: obj
        };
        return { v: obj.v, n: obj.n }; //Done to prevent injection
    } catch (err) {
        return null;
    }
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

bu.setVariable = async function (name, key, value, type, guildId) {
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
        setter: async (context, name, value) =>
            await bu.setVariable(context.guild.id, name, value,
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
        setter: async (context, name, value) => {
            if (context.author)
                return await bu.setVariable(context.author, name, value, bu.TagVariableType.AUTHOR);
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
        setter: async (context, name, value) =>
            await bu.setVariable(undefined, name, value, bu.TagVariableType.GLOBAL),
        getter: async (context, name) =>
            await bu.getVariable(undefined, name, bu.TagVariableType.GLOBAL)
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: async (context, name, value) => { return ''; }, //Temporary is never persisted to the database
        getter: async (context, name) => { } //Temporary is never persisted to the database
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        setter: async (context, name, value) => {
            if (context.isCC)
                return await bu.setVariable(context.tagName, name, value, bu.TagVariableType.GUILDLOCAL, context.guild.id);
            return await bu.setVariable(context.tagName, name, value, bu.TagVariableType.LOCAL);
        },
        getter: async (context, name) => {
            if (context.isCC)
                return await bu.getVariable(context.tagName, name, bu.TagVariableType.GUILDLOCAL, context.guild.id);
            return await bu.getVariable(context.tagName, name, bu.TagVariableType.LOCAL);
        }
    }
];