var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'parseint';
e.args = '&lt;text&gt;';
e.usage = '{parseint;text}';
e.desc = 'Returns an integer from text. If it wasn\'t a number, returns NaN';
e.exampleIn = '{parseint;abcd} {parseint;1234} {parseint;12cd}';
e.exampleOut = 'NaN 1234 12';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    
    let val = parseInt(args[1]);
    if (isNaN(val)) replaceString = 'NaN';
    else replaceString = val;

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};