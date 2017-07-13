/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-07-13 12:39:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `rolecreate`;
e.args = `<name> [color] [permissions] [mentionable] [hoisted]`;
e.usage = `{rolesetmentionable;name[;color[;permissions[;mentionable[;hoisted]]]]}`;
e.desc = `Creates a role with the given information. Provide color in hex. Provide permissions as a number, which can be calculated <a href="https://discordapi.com/permissions.html">here</a>. Color defaults to 000000 (uncolored role), permissions defaults to 0, mentionable defaults to false, hoisted defaults to false. Returns the new role's ID.`;
e.exampleIn = `{createrole;Super Cool Role!;ff0000;0;false;true}`;
e.exampleOut = `11111111111111111`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (!params.isStaff) {
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        } else if (params.args.length > 1) {
            let canCont = true;
            let mentionable = false;
            if (params.args[4]) {
                mentionable = params.args[4].toLowerCase() == 'true';
            }
            let color = 0x000;
            if (params.args[2]) {
                color = parseInt(params.args[2].replace(/[^0-9a-f]/gi, ''), 16)
                if (isNaN(color)) {
                    replaceString = await bu.tagProcessError(params, '`Color not a number`');
                    canCont = false;
                }
            }

            let hoist = false;
            if (params.args[5]) {
                hoist = params.args[5].toLowerCase() == 'true';
            }

            let permissions = 0;
            if (params.args[3]) {
                permissions = parseInt(params.args[3]);
                if (isNaN(permissions)) {
                    replaceString = await bu.tagProcessError(params, '`Permissions not a number`');
                    canCont = false;
                }
            }
            if (canCont)
                try {
                    let role = await params.msg.guild.createRole({
                        name: params.args[1],
                        permissions,
                        color,
                        hoist,
                        mentionable
                    }, `Created with the '${params.tagName}' command, executed by ${msg.author.username}#${msg.author.discrim} (${msg.author.id})`);
                    replaceString = role.id;
                } catch (err) {
                    replaceString = await bu.tagProcessError(params, '`Failed to create role: no perms`');
                }
        }
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};