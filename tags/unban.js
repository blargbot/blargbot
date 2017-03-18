var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `unban`;
e.args = `&lt;user&gt; [reason] [noperms]`;
e.usage = `{channel;user[;reason[;noperms]]}`;
e.desc = `Unbans a user. This functions the same as the unban command. If noperms is provided, do not check if the command executor is actually able to ban people. Only provide this if you know what you're doing.`;
e.exampleIn = `{unban;@user;0;This is a test unban}@user was unbanned!`;
e.exampleOut = `@user was unbanned!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (!params.isStaff) {
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        } else if (params.args.length > 1) {
            let user = await bu.getUser(params.msg, params.args[1], true);
            if (user) {
                let noPerms = params.args[3] ? true : false;
                let response = await CommandManager.list['unban'].unban(params.msg, user, params.args[2], true, noPerms);
                logger.debug('Response', response);
                if (typeof response[1] == 'string' && response[1].startsWith('`')) {
                    replaceString = await bu.tagProcessError(params, response[1]);
                } else replaceString = response[1];
            } else {
                replaceString = await bu.tagProcessError(params, '`No user found`');
            }
        }
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};