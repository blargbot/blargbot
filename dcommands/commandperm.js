var e = module.exports = {};
var bu;

const async = require('asyncawait/async');
const await = require('asyncawait/await');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'commandperm < list | setrole <commandname | "commandname,..."> [role name]... | setperm <commandname | "commandname,..."> [perm number] >';
e.info = `Changes command-specific usage permissions.
**__list__** - shows a list of modified commands (role required/perms required)
**__setrole__** - sets the role(s) required in order to use the command(s). Set to blank to disable the custom role requirement.
**__setperm__** - sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated at <https://discordapi.com/permissions.html>. Set to blank to disable the custom permission options.`;
e.longinfo = `<p>Changes command-specific usage permissions.</p>
<table>
<thead>
<tr><th>argument</th>
<th>description</th></tr>
</thead>
<tbody>
<tr><th>list</th>
<th>shows a list of modified commands (role required/perms required)</th></tr>
<tr><th>setrole</th>
<th>sets the role(s) required in order to use the command(s)</th></tr>
<tr><th>setperm</th>
<th>sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated <a href="https://discordapi.com/permissions.html">here</a></th></tr>
</tbody>
</table>`;

e.execute = async((msg, words) => {
    if (words.length >= 2) {
        let commandName;
        let storedGuild = await(bu.r.table('guild').get(msg.channel.guild.id));
        let commandperms = storedGuild.commandperms;
        let commands, toSend;
        switch (words[1].toLowerCase()) {
            case 'list':
                let message = '__Modified Commands:__\n';
                let commandList = [];
                for (let key in commandperms) {
                    commandList.push(`**${key}** ${commandperms[key].rolename
                        ? ' - ROLE: ' + commandperms[key].rolename
                        : ''}${commandperms[key].permission
                            ? ' - PERM: ' + commandperms[key].permission
                            : ''}`);
                }
                if (commandList.length > 0) message += commandList.join('\n');
                else message += 'No modified commands found.';
                bu.send(msg.channel.id, message);
                break;
            case 'setrole':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                }
                commands = words[2].toLowerCase().split(/\s*,\s*/);
                toSend = '';
                if (words.length == 3) {
                    toSend += `Removed the custom role requirement from command(s)\n\`\`\`fix\n`;
                } else if (words.length >= 4) {
                    toSend += `Added custom role requirement to command(s)\n\`\`\`fix\n`;
                }
                for (let i = 0; i < commands.length; i++) {
                    if (bu.commandList.hasOwnProperty(words[2].toLowerCase())) {
                        commandName = bu.commandList[words[2].toLowerCase()].name;
                        if (bu.commands[commandName].category == bu.CommandType.CAT
                            || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                            bu.logger.debug('no ur not allowed');
                        } else {
                            if (words.length == 3) {
                                if (commandperms.hasOwnProperty(commandName)) {
                                    commandperms[commandName].rolename = null;
                                }
                            } else if (words.length >= 4) {
                                commandperms[commandName].rolename = words.slice(3);
                            }
                        }
                    } else {
                        bu.send(msg.channel.id, `That's not a command!`);
                    }
                }
                bu.send(msg.channel.id, toSend + '\n```');
                break;
            case 'setperm':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                }
                commands = words[2].toLowerCase().split(/\s*,\s*/);
                toSend = '';
                if (words.length == 3) {
                    toSend += `Removed the custom role requirement from command(s)\n\`\`\`fix\n`;
                } else if (words.length >= 4) {
                    toSend += `Added custom role requirement to command(s)\n\`\`\`fix\n`;
                }
                for (let i = 0; i < commands.length; i++) {
                    if (bu.commandList.hasOwnProperty(words[2].toLowerCase())) {
                        commandName = bu.commandList[words[2].toLowerCase()].name;
                        if (bu.commands[commandName].category == bu.CommandType.CAT
                            || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                            bu.logger.debug('no ur not allowed');
                        } else {
                            if (words.length == 3) {
                                if (commandperms.hasOwnProperty(commandName)) {
                                    commandperms[commandName].permission = null;
                                }
                            } else if (words.length >= 4) {
                                let allow = parseInt(words[3]);
                                if (!isNaN(allow))
                                    commandperms[commandName].permission = allow;
                                else {
                                    bu.send(msg.channel.id, `The permissions must be in a numeric format. See <https://discordapi.com/permissions.html> for more details.`);
                                    return;
                                }
                            }
                        }
                    } else {
                        bu.send(msg.channel.id, `That's not a command!`);
                    }
                }
                bu.send(msg.channel.id, toSend + '\n```');
                /*
                                if (!words[2]) {
                                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                                }
                                if (bu.commandList.hasOwnProperty(words[2].toLowerCase())) {
                                    commandName = bu.commandList[words[2].toLowerCase()].name;
                                    if (bu.commands[commandName].category == bu.CommandType.CAT
                                        || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                                        bu.logger.debug('no ur not allowed');
                                        bu.send(msg.channel.id, `That's not a command!`);
                                        return;
                                    }
                                    if (words.length == 3) {
                                        bu.db//.query(`insert into commandperm (guildid, commandname, permission) values (?, ?, null)
                                on duplicate key update rolename = values(rolename)`, [msg.channel.guild.id, words[2].toLowerCase()], (err) => {
                                                if (err) bu.logger.error(err);
                                                bu.send(msg.channel.id, `Removed the custom permission options from command \`${words[2].toLowerCase()}\``);
                                            });
                                    } else if (words.length >= 4) {
                                        let allow = parseInt(words[3]);
                                        if (!isNaN(allow))
                                            bu.db//.query(`insert into commandperm (guildid, commandname, permission) values (?, ?, ?)
                                on duplicate key update permission = values(permission)`, [msg.channel.guild.id, words[2].toLowerCase(), allow], (err) => {
                                                    if (err) bu.logger.error(err);
                                                    bu.send(msg.channel.id, `Added custom permission options to command \`${words[2].toLowerCase()}\``);
                                                });
                                        else
                                            bu.send(msg.channel.id, `The permissions must be in a numeric format. See <https://discordapi.com/permissions.html> for more details.`);
                                    }
                                }
                                */
                break;
            default:
                bu.send(msg.channel.id, `Unrecognized arguments provided. Please do \`b!help commandperm\` for more details.`);
                break;
        }
    } else {
        bu.send(msg.channel.id, 'Not enough arguments provided!');
    }

});