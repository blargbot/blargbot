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
e.name = `if`;
e.args = `&lt;evaluator&gt; &lt;arg1&gt; &lt;arg2&gt; &lt;then&gt; &lt;else&gt;`;
e.usage = `{if;evaluator;arg1;arg2;then;else}`;
e.desc = `Evaluates <code>arg1</code> and <code>arg2</code> using the <code>evaluator</code>. If
                                it
                                returns
                                true,
                                the tag returns <code>then</code>. Otherwise, it returns <code>else</code>. Valid
                                evaluators are
                                <code>==</code>
                                <code>!=</code> <code>&lt;</code> <code>&lt;=</code> <code>&gt;</code> <code>
                                    &gt;=</code>
                            `;
e.exampleIn = `{if;&lt;=;5;10;5 is less than or equal to 10;5 is greater than 10}`;
e.exampleOut = `5 is less than or equal to 10`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 5) {
        switch (args[1]) {
            case '==':
                if (args[2] == args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
            case '!=':
                if (args[2] != args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
            case '>=':
                if (args[2] >= args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
            case '<=':
                if (args[2] <= args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
            case '>':
                if (args[2] > args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
            case '<':
                if (args[2] < args[3])
                    replaceString = args[4];
                else
                    replaceString = args[5];
                break;
        }
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};