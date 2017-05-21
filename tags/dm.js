/*
 * @Author: stupid cat
 * @Date: 2017-05-21 12:20:00
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 12:48:05
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `dm`;
e.args = `<user> <message>`;
e.usage = `{dm;user;message}`;
e.desc = `DMs a user. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.`;
e.exampleIn = `{dm;stupid cat;Hello}`;
e.exampleOut = `DM: Hello`;

const DMCache = {};

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;
    if (params.msg.hasDmed) replaceString = await bu.tagProcessError(params, '`Already Have DMed`');
    else if (!params.isStaff) {
        replaceString = await bu.tagProcessError(params, '`Author must be staff`');
    } else {
        params.msg.hasDmed = true;
        let user = await bu.getUser(msg, args[1]);

        if (user === null)
            replaceString = await bu.tagProcessError(params, '`User not found`');
        else if (!params.msg.guild.members.get(user.id))
            replaceString = await bu.tagProcessError(params, '`User not on guild`');
        else {
            const DMChannel = await user.getDMChannel();
            if (!DMCache[user.id] || DMCache[user.id].count > 5 || DMCache[user.id].user != msg.author.id || DMCache[user.id].guild != params.msg.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                await bu.send(DMChannel.id, `The following message was sent from **__${params.msg.guild.name}__** (${params.msg.guild.id}), and was sent by **__${bu.getFullName(params.msg.author)}__** (${params.msg.author.id}):`)
                DMCache[user.id] = { user: params.msg.author.id, guild: params.msg.guild.id, count: 1 };
            }
            await bu.send(DMChannel.id, params.args[2]);
            DMCache[user.id].count++;
        }
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};