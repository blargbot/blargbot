var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `addrole`;
e.args = `&lt;role&gt; [user]`;
e.usage = `{addrole;role[;user]}`;
e.desc = `Gives a user a role, where role is a role ID or mention. You can find a list of roles and their ids by doing \`b!roles\`. Returns true if a role was given, and false otherwise.`;
e.exampleIn = `Have a role! {addrole;11111111111111111}`;
e.exampleOut = `Have a role! true`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (params.args.length > 1) {
            let member = params.msg.member;
            if (params.args[2]) {
                let user = await bu.getUser(params.msg, params.args[2], true);
                if (user) member = params.msg.guild.members.get(user.id);
            }
            if (member) {
                let regexp = /(\d{17,23})/;
                let role;
                if (regexp.test(params.args[1])) {
                    let roleId = params.args[1].match(regexp)[1];
                    role = params.msg.guild.roles.get(roleId);
                }
                if (!role)
                    replaceString = await bu.tagProcessError(params, '`No role found`');
                else {
                    let hasRole = bu.hasRole(member, role.id, false);
                    if (hasRole) replaceString = 'false';
                    else {
                        try {
                            await member.addRole(role.id);
                            replaceString = 'true';
                        } catch (err) {
                            logger.error(err);
                            replaceString = 'false';
                        }
                    }
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