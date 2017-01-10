var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'base';
e.args = '&lt;integer&gt; [origin] &lt;radix&gt;';
e.usage = '{base;integer[;origin];radix}';
e.desc = 'Converts a Base <code>origin</code> number into <code>radix</code>. Default <code>origin</code> is 10. <code>radix</code> must be between 2 and 36.';
e.exampleIn = '{base;255;16}';
e.exampleOut = 'FF';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (args.length > 1) {
        let args2 = parseInt(args[2]);
        let args3 = parseInt(args[3]);
        if (!args3) {
            args3 = args2;
            args2 = 10;
        }
        let args1 = parseInt(args[1], args2);
        if (isNaN(args1) || isNaN(args2) || isNaN(args2)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args1 = parsedFallback;
            }
        } else {
            replaceString = args1.toString(args3);
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};