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
e.name = 'pad';
e.args = '&lt;direction&gt; &lt;text&gt; &lt;back&gt;';
e.usage = '{pad;direction;text;back}';
e.desc = 'Pads <code>back</text> to the <code>direction</code> of <code>text</code>';
e.exampleIn = '{pad;left;ABC;000000}';
e.exampleOut = '000ABC';

e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let args = params.args;
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1] && params.args[2] && params.args[3]) {
        let args1 = args[1];
        let args2 = args[2];
        let args3 = args[3];
        switch (args1.toLowerCase()) {
            case 'left': {
                replaceString = args2.substr(args1.length) + args1;
                break;
            }
            case 'right': {
                replaceString = args1 + args2.substr(args1.length);
                break;
            }
            default: {
                replaceString = '`Invalid direction`';
            }
        }
    } else {
        replaceString = bu.tagProcessError(params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
