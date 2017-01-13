var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `bitwise`;
e.args = `&lt;evaluator&gt; &lt;arg1&gt; &lt;arg2&gt;`;
e.usage = `{bitwise;operator;arg1;arg2}`;
e.desc = `Accepts 2 boolean values (<code>true</code> or <code>false</code>) and returns the result of a bitwise operation on them.
             Valid bitwise operators are <code>||</code> <code>&&</code>`;
e.exampleIn = `{bitwise;&&;true;false}`;
e.exampleOut = `false`;


e.execute = async function(params) {
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length == 3){
        args[1] = await bu.processTagInner(params, 1);
        args[2] = await bu.processTagInner(params, 2);
        args[3] = await bu.processTagInner(params, 3);

        if ((args[2] != 'true' && args[2] != 'false') ||
            (args[3] != 'true' && args[3] != 'false')){
            replaceString = await bu.tagProcessError(params, '`Invalid Boolean`')
        } else {
            args[2] = args[2] == 'true';
            args[3] = args[3] == 'true';
            switch (args[1]){
                case '||':
                   replaceString = toString(args[2] || args[3]);
                   break;
                case '&&':
                   replaceString = toString(args[2] && args[3]);
                   break;
                default:
                    replaceString = await bu.tagProcessError(params, '`Invalid Operator`');
                    break;
            }
        }
    } else if (args.length < 3){
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    } else {
        replaceString = await bu.tagProcessError(params, '`Too many arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};