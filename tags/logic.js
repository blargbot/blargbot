var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `logic`;
e.args = `&lt;evaluator&gt; &lt;arg1&gt; &lt;arg2&gt;`;
e.usage = `{logic;operator;arg1;arg2}`;
e.desc = `Accepts 2 boolean values (<code>true</code> or <code>false</code>) and returns the result of a logic operation on them.
Valid logic operators are <code>||</code> <code>&&</code> <code>XOR</code> <code>!</code>`;
e.exampleIn = `{logic;&&;true;false}`;
e.exampleOut = `false`;

const operators = {
    '&&': (vals) => {
        if (vals.length == 1) return true;
        for (let i = 0; i < vals.length; i++) {
            if (vals[i] == false) return false;
        }
        return true;
    },
    '||': (vals) => {
        if (vals.length == 1) return true;
        for (let i = 0; i < vals.length; i++) {
            if (vals[i] == true) return true;
        }
        return false;
    },
    'xor': (vals) => {
        if (vals.length == 1) return true;
        let returnBool = false;
        for (let i = 0; i < vals.length; i++) {
            if (vals[i] == true) {
                if (returnBool == true) return false;
                else returnBool = true;
            }
        }
        return returnBool;
    },
    '!': (vals) => {
        return !vals[0];
    }
};

e.execute = async function(params) {
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length >= 2) {
        args[1] = await bu.processTagInner(params, 1);
        args[2] = await bu.processTagInner(params, 2);
        args[3] = await bu.processTagInner(params, 3);

        for (let i = 2; i < args.length; i++) {
            if (args[i].toLowerCase() == 'true' || args[i] == true)
                args[i] = true;
            else if (args[i].toLowerCase() == 'false' || args[i] == 0)
                args[i] = false;
            else replaceString = await bu.tagProcessError(params, '`Invalid Boolean`');
        }
        if (replaceString === '') {
            let not = false;
            if (args[1].startsWith('!') && args[1].length > 1) {
                not = true;
                args[1] = args[1].substring(1);
            }
            if (operators.hasOwnProperty(args[1].toLowerCase())) {
                let bool = operators[args[1].toLowerCase()](args.slice(2));
                if (not) bool = !bool;
                replaceString = bool.toString();
            } else replaceString = await bu.tagProcessError(params, '`Invalid Operator`');
        }
    } else if (args.length < 2) {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};