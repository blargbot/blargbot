var e = module.exports = {};

e.init = () => {
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
                                    &gt;=</code> <code>startswith</code> <code>endswith</code>
                            `;
e.exampleIn = `{if;&lt;=;5;10;5 is less than or equal to 10;5 is greater than 10}`;
e.exampleOut = `5 is less than or equal to 10`;


e.execute = async function(params) {
    // for (let i = 1; i < params.args.length; i++) {
    //      params.args[i] =await bu.processTagInner(params, i);
    // }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 4) {
        args[1] = await bu.processTagInner(params, 1);
        var arg1 = await bu.processTagInner(params, 2);
        var arg2 = await bu.processTagInner(params, 3);
        if (!isNaN(parseFloat(arg1))) {
            arg1 = parseFloat(arg1);
        }
        if (!isNaN(parseFloat(arg2))) {
            arg2 = parseFloat(arg2);
        }
        switch (args[1].toLowerCase()) {
            case '==':
                if (arg1 == arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case '!=':
                if (arg1 != arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case '>=':
                if (arg1 >= arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case '<=':
                if (arg1 <= arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case '>':
                if (arg1 > arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case '<':
                if (arg1 < arg2)
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case 'startswith':
                if (arg1.startsWith(arg2))
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            case 'endswith':
                if (arg1.endsWith(arg2))
                    replaceString = args[4];
                else
                    replaceString = args[5] || '';
                break;
            default:
                replaceString = await bu.tagProcessError(params, '`Invalid Operator`');
                break;
        }
        params.content = replaceString;
        replaceString = await bu.processTag(params);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};