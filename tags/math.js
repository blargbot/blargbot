var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

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


e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseFloat(fallback);
    if (args.length > 2) {
        var result = parseFloat(args[2]);
        if (isNaN(result)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: bu.tagProcessError(fallback, '`Not a number`'),
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
                        replaceString: bu.tagProcessError(fallback, '`Not a number`'),
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
        }
        replaceString = result;
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};