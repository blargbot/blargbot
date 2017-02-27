var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;

e.name = 'hasrole';
e.args = '&lt;rolenames&gt [user]';
e.usage = '{hasrole;rolename;user}';
e.desc = `Checks if a user has a role with the same name as the provided argument, and returns either 'true' or 'false'. rolename can also be an array of role names. If a user is provided, check that user.`;
e.exampleIn = 'You are a moderator: {hasrole;moderator}';
e.exampleOut = 'You are a moderator: false';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (!params.msg.guild) {
        replaceString = await bu.tagProcessError(params, '`Not in guild`');
    } else if (args[1]) {
        let member = params.msg.member;
        if (args[2]) {
            let user = await bu.getUser(params.msg, args[2], true);
            if (user)
                member = params.msg.guild.members.get(user.id);
            else {
                replaceString = await bu.tagProcessError(params, '`No user found`');
                return {
                    terminate: params.terminate,
                    replaceString: replaceString,
                    replaceContent: replaceContent
                };
            }
        }
        let deserialized = bu.deserializeTagArray(args[1]);
        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = bu.hasPerm(member, deserialized, true);
        } else {
            replaceString = bu.hasPerm(member, args[1], true);
        }
    } else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};