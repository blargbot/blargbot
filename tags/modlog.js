var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `modlog`;
e.args = `&lt;action&gt; &lt;user&gt; [mod] [reason] [color]`;
e.usage = `{modlog;action;user[;mod[;reason[;color]]]}`;
e.desc = `Creates a custom modlog entry for the given action and user. A color is a 6-digit hex code preceded by #.`;
e.exampleIn = `You did a bad! {modlog;Bad;{userid};;They did a bad;#ffffff}`;
e.exampleOut = `You did a bad! (modlog entry)`;

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
        } else if (params.args[1] && params.args[2]) {
            let action = params.args[1];
            let user = await bu.getUser(params.msg, params.args[2]);
            let mod, reason, color;
            if (user) {
                if (params.args[3])
                    mod = await bu.getUser(params.msg, params.args[3]);
                reason = params.args[4];
                if (params.args[5]) {
                    let toParse = params.args[5];
                    if (/^#[a-f0-9]{6}$/i.test(toParse)) {
                        color = parseInt(toParse.replace('#', ''), 16);
                    }
                }
                logger.verbose('Color:', color, 'meow');
                await bu.logAction(params.msg.guild, user, mod, action, reason, color);
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