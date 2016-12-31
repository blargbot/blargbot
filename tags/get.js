var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `get`;
e.args = `&lt;name&gt;`;
e.usage = `{get;name}`;
e.desc = `Returns a stored variable. Variables are unique per-tag.`;
e.exampleIn = `{get;testvar}`;
e.exampleOut = `This is a test var`;

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
    if (!tagName) {
        tagVars = bu.guildCache[params.msg.guild.id].vars || {};
    } else {
        let storedTag = await r.table('tag').get(tagName).run();
        if (!storedTag.hasOwnProperty('vars')) tagVars = {};
        else tagVars = storedTag.vars;
    }
    if (args.length == 2) {
        let result = tagVars[args[1]];
        if (Array.isArray(result)) {
            replaceString = bu.serializeTagArray(result, args[1]);
        } else
            replaceString = result;
    } else if (args.length > 2) {
        let result = tagVars[args[1]];
        if (Array.isArray(result)) {
            let index = parseInt(args[2]);
            if (isNaN(index)) {
                replaceString = await bu.tagProcessError(params, fallback, '`Invalid index`');
            } else {
                if (!result[index]) {
                    replaceString = await bu.tagProcessError(params, fallback, '`Undefined index`');
                } else
                    replaceString = result[index];
            }
        } else
            replaceString = result;
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};