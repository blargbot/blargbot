var e = module.exports = {};



e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `time`;
e.args = `[format]`;
e.usage = `{time}`;
e.desc = `Returns the current time, in UTC+0. If a <code>format</code> code is specified,
the date is formatted accordingly. Leave blank for default formatting. See the <a
href="http://momentjs.com/docs/#/displaying/format/">moment
documentation</a> for more information.`;
e.exampleIn = `It's currently {time;YYYY/MM/DD HH:mm:ss}`;
e.exampleOut = `It's currently 2016/01/01 01:00:00`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;
    var formatCode = '';
    if (args[1])
        formatCode = args[1];

    replaceString = dep.moment.tz('Etc/UTC').format(formatCode);

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};