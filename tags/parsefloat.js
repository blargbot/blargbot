var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'parsefloat';
e.args = '&lt;text&gt;';
e.usage = '{parsefloat;text}';
e.desc = 'Returns an floating point number from text. If it wasn\'t a number, returns NaN';
e.exampleIn = '{parsefloat;abcd} {parsefloat;12.34} {parsefloat;1.2cd}';
e.exampleOut = 'NaN 12.34 1.2';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    
    let val = parseFloat(args[1]);
    if (isNaN(val)) replaceString = 'NaN';
    else replaceString = val;

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};