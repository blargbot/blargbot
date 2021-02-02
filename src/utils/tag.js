/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:38
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-19 09:11:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const bbEngine = require('../structures/bbtag/Engine'),
    ReadWriteLock = require('rwlock');
const { tagVariableTypes } = require('../newbu');

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
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch (err) { }
    if (!parsed) {
        try {
            let replaced = value.replace(/([\[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                (_, before, from, to, after) => before + bu.getRange(from, to).join(',') + after);
            parsed = JSON.parse(replaced);
        }
        catch (err) { }
    }
    if (Array.isArray(parsed)) {
        parsed = {
            v: parsed
        };
    }
    if (!parsed || !Array.isArray(parsed.v) || (parsed.n !== undefined && typeof parsed.n != "string"))
        parsed = null;
    if (parsed) {
        return {
            n: parsed.n,
            v: parsed.v
        };
    }
    return null;
};

bu.getRange = function (from, to) {
    from = bu.parseInt(from);
    to = bu.parseInt(to);
    if (isNaN(from) || isNaN(to))
        throw new Error("Invalid from or to");
    let descending = from > to;
    let count = Math.abs(from - to) + 1;
    if (count > 200)
        throw new Error("Range cannot be larger than 200");
    let offset = Math.min(from, to);
    let values = [...Array(count).keys()].map(e => e + offset);
    if (descending)
        values = values.reverse();
    return values;
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

function getQuery(name, key, type, guildId) {
    let query = {
        type: null, name: key.substring(0, 255), scope: null
    };

    switch (type) {
        case tagVariableTypes.GUILD:
            query.type = 'GUILD_CC';
            query.scope = name;
            break;
        case tagVariableTypes.GUILDLOCAL:
            query.type = 'LOCAL_CC';
            query.scope = guildId + '_' + name;
            break;
        case tagVariableTypes.TAGGUILD:
            query.type = 'GUILD_TAG';
            query.scope = name;
            break;
        case tagVariableTypes.AUTHOR:
            query.type = 'AUTHOR';
            query.scope = name;
            break;
        case tagVariableTypes.LOCAL:
            query.type = 'LOCAL_TAG';
            query.scope = name;
            break;
        case tagVariableTypes.GLOBAL:
            query.type = 'GLOBAL';
            query.scope = '';
            break;
    }
    if (query.scope === null) {
        query.scope = '';
        console.info(type, key, name, guildId);
    }
    if (typeof query.scope === 'string')
        query.scope = query.scope.substring(0, 255);
    return query;
}

bu.setVariable = async function (name, values, type, guildId) {
    let vars = values;
    let updateObj = {};
    let storedThing;

    let vals = [];
    let trans = await bot.database.sequelize.transaction();
    for (const key in values) {
        let query = getQuery(name, key, type, guildId);
        let val = values[key];
        val = JSON.stringify(val);
        query.content = val;
        try {
            await bot.models.BBTagVariable.upsert(query);
        } catch (err) {
            console.error(err);
            if (err.errors) {
                for (const e of err.errors)
                    console.error(e.path, e.validatorKey, e.value);
            }
            console.info(query);
        }
    }
    return await trans.commit();
};

bu.getVariable = async function (name, key, type, guildId) {
    let query = getQuery(name, key, type, guildId);

    let v = await bot.models.BBTagVariable.findOne({
        where: query
    });
    let result;
    if (v) {
        result = v.get('content');
        // try parsing to a json value
        try {
            result = JSON.parse(result);
        } catch (err) { /* no-op */ }

        return result;
    }
    else return null;
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
                context.isCC && !context.tagVars ? tagVariableTypes.GUILD : tagVariableTypes.TAGGUILD),
        getter: async (context, name) =>
            await bu.getVariable(context.guild.id, name,
                context.isCC && !context.tagVars ? tagVariableTypes.GUILD : tagVariableTypes.TAGGUILD),
        getLock: (context, key) => bu.getLock(...['SERVER', context.isCC ? 'CC' : 'Tag', key])
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        setter: async (context, values) => {
            if (context.author)
                return await bu.setVariable(context.author, values, tagVariableTypes.AUTHOR);
            return bbEngine.addError({}, context, '`No author found`');
        },
        getter: async (context, name) => {
            if (context.author)
                return await bu.getVariable(context.author, name, tagVariableTypes.AUTHOR);
            return bbEngine.addError({}, context, '`No author found`');
        },
        getLock: (context, key) => bu.getLock(...['AUTHOR', context.author.id, key])
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.',
        setter: async (context, values) =>
            await bu.setVariable(undefined, values, tagVariableTypes.GLOBAL),
        getter: async (context, name) =>
            await bu.getVariable(undefined, name, tagVariableTypes.GLOBAL),
        getLock: (context, key) => bu.getLock(...['GLOBAL', key])
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: async (context, values) => { return ''; }, //Temporary is never persisted to the database
        getter: async (context, name) => { }, //Temporary is never persisted to the database
        getLock: (context, key) => context.getLock(key)
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        setter: async (context, values) => {
            if (context.isCC && !context.tagVars)
                return await bu.setVariable(context.tagName, values, tagVariableTypes.GUILDLOCAL, context.guild.id);
            return await bu.setVariable(context.tagName, values, tagVariableTypes.LOCAL);
        },
        getter: async (context, name) => {
            if (context.isCC && !context.tagVars)
                return await bu.getVariable(context.tagName, name, tagVariableTypes.GUILDLOCAL, context.guild.id);
            return await bu.getVariable(context.tagName, name, tagVariableTypes.LOCAL);
        },
        getLock: (context, key) => bu.getLock(...['LOCAL', context.isCC ? 'CC' : 'TAG', context.tagName])
    }
];

bu.getLock = function (...path) {
    let key = path.slice(-1)[0];
    path = path.slice(0, -1);

    let node = bu.tagLocks || (bu.tagLocks = {});

    for (const entry of path)
        node = node[entry] || (node[entry] = {});

    return node[key] || (node[key] = new ReadWriteLock());
};