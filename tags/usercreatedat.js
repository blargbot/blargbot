var e = module.exports = {};
var bu;
var moment = require('moment');

const async = require('asyncawait/async');
const await = require('asyncawait/await');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `usercreatedat`;
e.args = `[format] [user] [quiet]`;
e.usage = `{usercreatedat[;format[;user[;quiet]]]}`;
e.desc = `Returns the date the user was created, in UTC+0. If a <code>format</code> code is specified, the
                                date is
                                formatted
                                accordingly. Leave blank for default formatting. See the <a
                                    href="http://momentjs.com/docs/#/displaying/format/">moment
                                    documentation</a> for more information. If <code>name</code> is specified, gets that
                                user
                                instead.
                                If <code>quiet</code> is
                                specified, if a user can't be found it will simply return the <code>name</code>
                            `;
e.exampleIn = `Your account was created on {usercreatedat;YYYY/MM/DD HH:mm:ss}`;
e.exampleOut = `Your account was created on 2016/01/01 01:00:00.`;


e.execute = async((params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] =await(bu.processTagInner(params, i));
    }
    let args = params.args
        , msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await(bu.getTagUser(msg, args, 2));

    if (obtainedUser) {
        var createdDate = obtainedUser.createdAt;
        var formatCode = '';
        if (args[1])
            formatCode = args[1];

        replaceString = moment(createdDate).format(formatCode);
    }
    else if (!args[3])
        return '';
    else
        replaceString = args[2];

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});