/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:06:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `time`;
e.args = `[format] [time] [parseformat]`;
e.usage = `{time[;format[;time[;parseformat]]]}`;
e.desc = `Returns the current time, in UTC+0. If a <code>format</code> code is specified,
the date is formatted accordingly. Leave blank for default formatting. See the <a
href="http://momentjs.com/docs/#/displaying/format/">moment
documentation</a> for more information.<br>Additionally, you can specify another
time to display, and a format to parse it with. See
<a href="http://momentjs.com/docs/#/parsing/">here</a> for parsing documentation.`;
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
    let date = dep.moment(args[2], args[3], 'Etc/UTC');
    if (!date.isValid()) {
        replaceString = await bu.tagProcessError(params, '`Invalid date`');
    } else
        replaceString = date.tz('Etc/UTC').format(formatCode);

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
