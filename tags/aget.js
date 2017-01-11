var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.deprecated = true;
e.name = `aget`;
e.args = `&lt;name&gt; [index]`;
e.usage = `{aget;name[;index]}`;
e.desc = `Returns a stored variable, or an index in a stored array. Variables are unique per-author.`;
e.exampleIn = `{aget;testvar}`;
e.exampleOut = `This is a test var`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    let storedAuthor = await r.table('user').get(params.author);
    if (!storedAuthor) {
        return {
            replaceString: await bu.tagProcessError(params, '`Author not found`'),
            replaceContent
        }
    }
    let args = params.args, fallback = params.fallback;
    let authorVars = storedAuthor.vars || {};
    if (args.length == 2) {
        let result = authorVars[args[1]];
        if (Array.isArray(result)) {
            replaceString = bu.serializeTagArray(result, args[1], true);
        } else
            replaceString = result;
    } else if (args.length > 2) {
        let result = authorVars[args[1]];
        if (Array.isArray(result)) {
            let index = parseInt(args[2]);
            if (isNaN(index)) {
                replaceString = await bu.tagProcessError(params, '`Invalid index`');
            } else {
                if (!result[index]) {
                    replaceString = await bu.tagProcessError(params, '`Undefined index`');
                } else
                    replaceString = result[index];
            }
        } else
            replaceString = result;
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};