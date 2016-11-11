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
    let storedTag = await r.table('tag').get(tagName).run();
    if (!storedTag) {
        tagVars = bu.guildCache[params.msg.guild.id].vars || {};
    } else if (!storedTag.hasOwnProperty('vars')) tagVars = {};
    else tagVars = storedTag.vars;
    if (args.length > 1) {
        replaceString = tagVars[args[1]];
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};