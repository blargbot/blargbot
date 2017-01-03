var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'void';
e.args = '[anything]';
e.usage = '{void[;anything]}';
e.desc = 'Parses its inner tags, but doesn\'t return anything.';
e.exampleIn = '{void;This won\'t be outputted!}';
e.exampleOut = '';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};