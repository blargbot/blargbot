var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `upper`;
e.args = `&lt;text&gt;`;
e.usage = `{upper;text}`;
e.desc = `Returns <code>string</code> as uppercase`;
e.exampleIn = `{upper;this will become uppercase}`;
e.exampleOut = `THIS WILL BECOME UPPERCASE`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1)
        replaceString = args[1].toUpperCase();
    else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};