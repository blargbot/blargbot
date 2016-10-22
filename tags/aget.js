var e = module.exports = {};
var bu;




var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `aget`;
e.args = `&lt;name&gt;`;
e.usage = `{aget;name}`;
e.desc = `Returns a stored variable. Variables are unique per-author.`;
e.exampleIn = `{aget;testvar}`;
e.exampleOut = `This is a test var`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (!bu.vars.authorTags[params.author]) {
        bu.vars.authorTags[params.author] = {};
    }
    if (params.args.length > 1) {
        replaceString = bu.vars.authorTags[params.author][params.args[1]];
    } else {
        replaceString = await bu.tagProcessError(params, params.fallback, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};