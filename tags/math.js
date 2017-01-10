var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `math`;
e.args = `&lt;operator&gt; &lt;operands...&gt;`;
e.usage = `{math;operator;operands...}`;
e.desc = `Returns a number based on the operator and operands. Valid operators are <code>+</code>
                                <code>-</code>
                                <code>*</code> <code>/</code> <code>%</code> <code>^</code>
                            `;
e.exampleIn = `2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}`;
e.exampleOut = `2 + 3 + 6 - 2 = 9`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseFloat(fallback);
    if (args.length > 2) {
        var result = parseFloat(args[2]);
        if (isNaN(result)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                result = parsedFallback;
            }
        }
        for (let i = 3; i < args.length; i++) {
            args[i] = parseFloat(args[i]);
            if (isNaN(args[i])) {
                if (isNaN(parsedFallback)) {
                    return {
                        replaceString: await bu.tagProcessError(params, '`Not a number`'),
                        replaceContent: replaceContent
                    };
                } else {
                    args[i] = parsedFallback;
                }
            }
        }
        switch (args[1]) {
            case '+':
                for (var i = 3; i < args.length; i++) {
                    result += args[i];
                }
                break;
            case '-':
                for (i = 3; i < args.length; i++) {
                    result -= args[i];
                }
                break;
            case '*':
                for (i = 3; i < args.length; i++) {
                    result *= args[i];
                }
                break;
            case '/':
                for (i = 3; i < args.length; i++) {
                    result /= args[i];
                }
                break;
            case '%':
                for (i = 3; i < args.length; i++) {
                    result %= args[i];
                }
                break;
            case '^':
                for (i = 3; i < args.length; i++) {
                    result = Math.pow(result, args[i]);
                }
                break;
        }
        replaceString = result;
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};