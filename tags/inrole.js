var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `inrole`;
e.args = `&lt;roleid&gt;`;
e.usage = `{inrole;roleid}`;
e.desc = `Returns how many people are in a specific role.`;
e.exampleIn = `There are {inrole;11111111111111111} people in the role!`;
e.exampleOut = `There are 5 people in the role!`;

e.execute = async function (params) {
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        let role = params.msg.guild.roles.get(params.args[1]);
        if (role) {
            let amount = params.msg.guild.members.filter(m => m.roles.includes(role.id)).length;
            replaceString = amount;
        } else {
            replaceString = await bu.tagProcessError(params, '`Role not found`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};