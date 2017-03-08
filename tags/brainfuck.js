var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `brainfuck`;
e.args = `&lt;code&gt; [input]`;
e.usage = `{brainfuck;code[;input]}`;
e.desc = `Interprets brainfuck input.`;
e.exampleIn = `{abs;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}`;
e.exampleOut = `Hello World!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        try {
            replaceString = (dep.brainfuck.execute(args[1], args[2])).output;
        } catch (err) {
            replaceString = await bu.tagProcessError(params, '`' + err.message + '`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};