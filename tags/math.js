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
                                <code>*</code> <code>/</code> <code>%</code>
                            `;
e.exampleIn = `2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}`;
e.exampleOut = `2 + 3 + 6 - 2 = 9`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 2) {
        var result = bu.tagGetFloat(bu.processSpecial(args[2]));
        switch (args[1]) {
            case '+':
                for (var i = 3; i < args.length; i++) {
                    console.log('+ args', args[i]);
                    result += bu.tagGetFloat(bu.processSpecial(args[i]));
                }
                break;
            case '-':
                for (i = 3; i < args.length; i++) {
                    result -= bu.tagGetFloat(bu.processSpecial(args[i]));
                }
                break;
            case '*':
                for (i = 3; i < args.length; i++) {
                    result *= bu.tagGetFloat(bu.processSpecial(args[i]));
                }
                break;
            case '/':
                for (i = 3; i < args.length; i++) {
                    result /= bu.tagGetFloat(bu.processSpecial(args[i]));
                }
                break;
            case '%':
                for (i = 3; i < args.length; i++) {
                    result %= bu.tagGetFloat(bu.processSpecial(args[i]));
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