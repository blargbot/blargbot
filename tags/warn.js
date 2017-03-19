var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `warn`;
e.args = `[user] [count] [reason]`;
e.usage = `{warn[;user[;count[;reason]]]}`;
e.desc = `Gives a user the specified number of warnings with the given reason, and returns their new warning count.`;
e.exampleIn = `Be warned! {warn}`;
e.exampleOut = `Be warned! 1`;

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
        } else {
            let user = params.msg.author;
            if (params.args[1]) {
                user = await bu.getUser(params.msg, params.args[1], true);
            }

            if (user) {
                let count = 1;
                if (params.args[2]) count = parseInt(params.args[2]);
                if (!isNaN(count)) {
                    let reason = params.args[3];
                    let res = await bu.issueWarning(user, params.msg.guild, count);
                    await bu.logAction(params.msg.guild, user, undefined, 'Tag Warning', reason, bu.ModLogColour.WARN, [{
                        name: 'Warnings',
                        value: `Assigned: ${count}\nNew Total: ${res.count || 0}`,
                        inline: true
                    }]);
                    replaceString = res.count;
                } else {
                    replaceString = await bu.tagProcessError(params, '`Not a number`');
                }
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