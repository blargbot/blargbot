var e = module.exports = {};
var bu;



var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `userid`;
e.args = `[user] [quiet]`;
e.usage = `{userid[;user[;quiet]]}`;
e.desc = `Returns the user's ID. If <code>name</code> is specified, gets that user instead. If
                                <code>quiet</code>
                                is
                                specified, if a user can't be found it will simply return the <code>name</code>`;
e.exampleIn = `Your id is {userid}`;
e.exampleOut = `Your id is 123456789123456`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args
        , msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args);

    if (obtainedUser)
        replaceString = obtainedUser.id;

    else if (!args[2])
        return '';
    else
        replaceString = args[1];


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};