var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `set`;
e.args = `&lt;name&gt; &lt;value&gt; [value]...`;
e.usage = `{set;name;value[;value]...}`;
e.desc = `Stores a variable. These variables are saved between sessions, and are unique per-tag. If used in a custom command, they are unique per-guild. If multiple values are specified, an array is created.`;
e.exampleIn = `{set;testvar;This is a test var}`;
e.exampleOut = ``;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        tagName = params.tagName;
    var replaceString = '';
    var replaceContent = false;
    let tagVars;
    let isCcommand = !tagName;
    if (isCcommand) {
        tagVars = bu.guildCache[params.msg.guild.id].vars || {};
    } else {
        let storedTag = await r.table('tag').get(tagName).run();
        if (!storedTag.hasOwnProperty('vars')) storedTag.vars = {};
        tagVars = storedTag.vars;
    }

    if (args.length == 3) {
        let deserialized = bu.deserializeTagArray(args[2]);
        if (deserialized && deserialized.v) {
            tagVars[args[1]] = deserialized.v;
        } else tagVars[args[1]] = args[2];
    } else if (args.length > 3) {
        tagVars[args[1]] = args.slice(2);
    } else if (args.length == 2) {
        tagVars[args[1]] = null;
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

    if (isCcommand) await saveGuild(params.msg.guild.id, tagVars);
    else await saveTag(tagName, tagVars);

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};

async function saveGuild(guildId, vars) {
    await r.table('guild').get(guildId).update({
        vars: vars
    }).run();
}

async function saveTag(tagName, vars) {
    await r.table('tag').get(tagName).update({
        vars: vars
    }).run();
}