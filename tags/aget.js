var e = module.exports = {};






e.init = () => {
    
    

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
    let storedAuthor = await r.table('user').get(params.author);
    let authorVars = storedAuthor.vars || {};
    if (params.args.length > 1) {
        replaceString = authorVars[params.args[1]];
    } else {
        replaceString = await bu.tagProcessError(params, params.fallback, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};