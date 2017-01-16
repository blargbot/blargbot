var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `abs`;
e.args = `&lt;number&gt;`;
e.usage = `{abs;number}`;
e.desc = `Gets the absolute value of a number`;
e.exampleIn = `{abs;-535}`;
e.exampleOut = `535`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        var asNumber = parseFloat(args[1]);
        if (!isNaN(asNumber)) {
            replaceString = Math.abs(asNumber);
        } else {
            replaceString = await bu.tagProcessError(params, '`Not a number`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};