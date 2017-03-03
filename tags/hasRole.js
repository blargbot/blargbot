var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;

e.name = 'hasrole';
e.args = '&lt;roleids&gt [user]';
e.usage = '{hasrole;roleid...;user}';
e.desc = `Checks if a user has a role with the same id as the provided argument, and returns either 'true' or 'false'. rolename can also be an array of role names. If a user is provided, check that user.`;
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
        let rawRoles = [];
        let roles = [];
        if (deserialized && Array.isArray(deserialized.v)) {
            rawRoles = deserialized.v;
        } else {
            rawRoles.push(args[1]);
        }
        for (let i = 0; i < rawRoles.length; i++) {
            let regexp = /(\d{17,23})/;
            if (regexp.test(rawRoles[i]))
                roles.push(rawRoles[i].match(regexp)[1]);
        }
        if (roles.length == 0) {
            replaceString = await bu.tagProcessError(params, '`No valid roles`');
        } else {
            replaceString = bu.hasRole(params.msg, roles, false);
        }
    } else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};