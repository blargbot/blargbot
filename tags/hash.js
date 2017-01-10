var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'hash';
e.args = '&lt;text&gt;';
e.usage = '{hash;text}';
e.desc = 'Returns the numeric hash of any given text, based on the unicode value of each individual character. This results in seemingly randomly generated numbers that are constant for each specific query.';
e.exampleIn = 'The hash of brown is {hash;brown}';
e.exampleOut = 'The hash of brown is 94011702';


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args[1]) {
        replaceString = args[1].split('').reduce(function(a, b) {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
    } else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};