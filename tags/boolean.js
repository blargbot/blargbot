var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `bool`;
e.args = `&lt;evaluator&gt; &lt;arg1&gt; &lt;arg2&gt;`;
e.usage = `{bool;evaluator;arg1;arg2}`;
e.desc = `Evaluates <code>arg1</code> and <code>arg2</code> using the <code>evaluator</code> and returns <code>true</code> or <code>false</code>. Valid
                                evaluators are
                                <code>==</code>
                                <code>!=</code> <code>&lt;</code> <code>&lt;=</code> <code>&gt;</code> <code>
                                    &gt;=</code> <code>startswith</code> <code>endswith</code>
                            `;
e.exampleIn = `{bool;&lt;=;5;10}`;
e.exampleOut = `true`;


e.execute = async function(params) {
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 2) {
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
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case '!=':
                if (arg1 != arg2)
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case '>=':
                if (arg1 >= arg2)
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case '<=':
                if (arg1 <= arg2)
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case '>':
                if (arg1 > arg2)
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case '<':
                if (arg1 < arg2)
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case 'startswith':
                if (arg1.startsWith(arg2))
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            case 'endswith':
                if (arg1.endsWith(arg2))
                    replaceString = "true";
                else
                    replaceString = "false" || '';
                break;
            default:
                replaceString = await bu.tagProcessError(params, '`Invalid Operator`');
                break;
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};