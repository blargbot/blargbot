var e = module.exports = {};
const moment = require('moment-timezone')

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'date';
e.args = '&lt;time&gt; [format [timezone]]';
e.usage = '{date;time[;format[;timezone]]}';
e.desc = 'Turns the time into a date. '
    + '<code>time</code> can be either a timestamp, or the word "now" for current time. If '
    + '<code>format</code> is specified, it will use <a href="">momentjs formatting</a> to format it. '
    + 'If <code>timezone<code> is specified, it will use that timezone to determine the time. Timezones '
    + 'can be found on <a href="http://momentjs.com/timezone/">this map</a>.';
e.exampleIn = '{date;now;M/D/Y | h:mm A;America/Los_Angeles}';
e.exampleOut = '1/24/2017 | 10:30 PM';

e.execute = async function(params) {
    var args = [];
    for (let i = 1; i < params.args.length; i++) {
        args[i-1] = await bu.processTagInner(params, i);
    }
    var tzexists = tz => Boolean(moment.tz.zone('America/Los_Angeles'));
    var replaceString = '';
    var replaceContent = false;
    var time = parseInt(args[0], 10);
    var dateobj;
    if (args[0] === 'now') dateobj = moment();
    else dateobj = moment(time);
    if (args[2]) {
        if (tzexists(args[2])) dateobj = dateobj.tz(args[2]);
        else return {
                replaceString: await bu.tagProcessError(params, '`Invalid Timezone`'),,
                replaceContent: replaceContent
            };
    }
    if (args[1]) replaceString = dateobj.format(args[1]);
    else replaceString = dateobj.format();
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};