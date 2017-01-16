var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'switch';
e.args = '&lt;arg&gt; &lt;case1&gt; &lt;then1&gt; [case2] [then2].. [default]';
e.usage = '{switch;arg;case1;then1[;case2;then2..][;default]}';
e.desc = 'Finds the <code>case</code> that matches <code>arg</code> and returns the following <code>then</code>.' +
    'If there is no matching <code>case</code> and <code>default</code> is specified,' +
    '<code>default</code> is returned. If not, it returns blank.';
e.exampleIn = '{switch;{args;0};yes;Correct!;no;Incorrect!;That is not yes or no}';
e.exampleOut = 'Correct!';

e.execute = async function(params) {
    params.args[1] = await bu.processTagInner(params, 1);
    for (let i = 2; i < params.args.length; i += 2) {
        if (i != params.args.length - 1)
            params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args;
    var replaceString = '';
    var replaceContent = false;
    var elseDo = '';
    var cases = {};
    args.shift();
    var arg = args[0];
    args.shift();
    for (let i = 0; i < args.length; i++) {
        if (i != args.length - 1) {
            cases[args[i]] = args[i + 1];
            i++;
        } else {
            elseDo = args[i];
        }
    }
    if (args.length % 2 != 0) replaceString = cases[arg] || elseDo;
    else replaceString = cases[arg] || '';
    params.content = replaceString;
    replaceString = await bu.processTag(params);
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};