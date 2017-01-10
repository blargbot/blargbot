var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'pad';
e.args = '&lt;direction&gt; &lt;text&gt; &lt;back&gt;';
e.usage = '{pad;direction;text;back}';
e.desc = 'Pads <code>back</code> to the <code>direction</code> of <code>text</code>';
e.exampleIn = '{pad;left;ABC;000000}';
e.exampleOut = '000ABC';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args;
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1] && params.args[2] && params.args[3]) {
        let args1 = args[1];
        let args2 = args[2];
        let args3 = args[3];
        switch (args1.toLowerCase()) {
            case 'left':
                {
                    replaceString = args2.substr(args3.length) + args3;
                    break;
                }
            case 'right':
                {
                    replaceString = args3 + args2.substr(args3.length);
                    break;
                }
            default:
                {
                    replaceString = '`Invalid direction`';
                }
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};