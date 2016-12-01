var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `userdiscrim`;
e.args = `[user] [quiet]`;
e.usage = `{userdiscrim[;user[;quiet]]}`;
e.desc = `Returns the user's discriminator. If <code>name</code> is specified, gets that user
                                instead. If
                                <code>quiet</code>
                                is
                                specified, if a user can't be found it will simply return the <code>name</code>`;
e.exampleIn = `Your discrim is {userdiscrim}`;
e.exampleOut = `Your discrim is 1234`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args);
    if (obtainedUser)
        replaceString = obtainedUser.discriminator;

    else if (!args[2])
        return '';
    else
        replaceString = args[1];

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};