var e = module.exports = {};


const util = require('util');


e.init = () => {


    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'editcommand < list | setrole <commandname | "commandname,..."> [role name]... | setperm <commandname | "commandname,..."> [perm number] | toggle <commandname | "commandname,...">';
e.info = `Changes command-specific usage permissions.
**__list__** - Shows a list of modified commands (role required/perms required)
**__setrole__** - Sets the role(s) required in order to use the command(s). Set to blank to disable the custom role requirement.
**__setperm__** - Sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated at <https://discordapi.com/permissions.html>. Set to blank to disable the custom 
**__toggle__** - Enables/disables the listed commands
permission options.`;
e.longinfo = `<p>Changes command-specific usage permissions.</p>
<table>
<thead>
<tr><th>argument</th>
<th>description</th></tr>
</thead>
<tbody>
<tr><th>list</th>
<th>Shows a list of modified commands (role required/perms required)</th></tr>
<tr><th>setrole</th>
<th>Sets the role(s) required in order to use the command(s)</th></tr>
<tr><th>setperm</th>
<th>Sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated <a href="https://discordapi.com/permissions.html">here</a></th></tr>
<tr><th>toggle</th>
<th>Enables/disables the listed commands</th></tr>
</tbody>
</table>`;

e.execute = async function (msg, words) {
    if (words.length >= 2) {
        let commandName;
        let storedGuild = await bu.r.table('guild').get(msg.channel.guild.id);
        let commandperms = storedGuild.commandperms;
        if (!commandperms) commandperms = {};
        let commands, toSend, changedCommands = [];
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
                    break;
                }
                commands = words[2].toLowerCase().split(/\s*,\s*/);
                toSend = '';
                if (words.length == 3) {
                    toSend += `Removed the custom role requirement from command(s)\n\`\`\`fix\n`;
                } else if (words.length >= 4) {
                    toSend += `Added custom role requirement to command(s)\n\`\`\`fix\n`;
                }
                for (let i = 0; i < commands.length; i++) {
                    if (bu.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                        commandName = bu.commandList[commands[i].toLowerCase()].name;
                        if (bu.commands[commandName].category == bu.CommandType.CAT
                            || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                            logger.debug('no ur not allowed');
                        } else {
                            if (words.length == 3) {
                                if (commandperms.hasOwnProperty(commandName)) {
                                    commandperms[commandName].rolename = null;
                                }
                            } else if (words.length >= 4) {
                                if (!commandperms.hasOwnProperty(commandName)) commandperms[commandName] = {};
                                commandperms[commandName].rolename = words.slice(3);
                                changedCommands.push(commandName);
                            }
                        }
                    } else {
                        if (commands.length == 1) { bu.send(msg.channel.id, `That's not a command!`); break; }
                    }
                }
                await bu.r.table('guild').get(msg.channel.guild.id).update({
                    commandperms: commandperms
                }).run();
                bu.send(msg.channel.id, toSend + changedCommands.join(', ') + '\n```');
                break;
            case 'toggle':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                    break;
                }
                commands = words[2].toLowerCase().split(/\s*,\s*/);
                let disabledList = [];
                let enabledList = [];
                for (let i = 0; i < commands.length; i++) {
                    if (bu.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                        commandName = bu.commandList[commands[i].toLowerCase()].name;
                        if (bu.commands[commandName].category == bu.CommandType.CAT
                            || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                            logger.debug('no ur not allowed');
                        } else {
                            logger.debug(commandperms[commandName]);
                            if (!commandperms.hasOwnProperty(commandName)) commandperms[commandName] = {};
                            if (!commandperms[commandName].disabled) {
                                commandperms[commandName].disabled = true;
                                disabledList.push(commandName);
                            } else {
                                commandperms[commandName].disabled = false;
                                enabledList.push(commandName);
                            }
                        }
                    } else {
                        if (commands.length == 1) { bu.send(msg.channel.id, `That's not a command!`); break; }
                    }
                }
                await bu.r.table('guild').get(msg.channel.guild.id).update({
                    commandperms: commandperms
                }).run();
                bu.send(msg.channel.id, util.format('Commands enabled:\n```\n%s \n```\nCommands disabled:\n```\n%s \n```'
                    , enabledList.join(', '), disabledList.join(', ')));
                break;
            case 'setperm':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                    break;
                }
                commands = words[2].toLowerCase().split(/\s*,\s*/);
                toSend = '';
                if (words.length == 3) {
                    toSend += `Removed the custom role requirement from command(s)\n\`\`\`fix\n`;
                } else if (words.length >= 4) {
                    toSend += `Added custom role requirement to command(s)\n\`\`\`fix\n`;
                }
                for (let i = 0; i < commands.length; i++) {
                    if (bu.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                        commandName = bu.commandList[commands[i].toLowerCase()].name;
                        if (bu.commands[commandName].category == bu.CommandType.CAT
                            || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                            logger.debug('no ur not allowed');
                        } else {
                            if (words.length == 3) {
                                if (commandperms.hasOwnProperty(commandName)) {
                                    commandperms[commandName].permission = null;
                                }
                            } else if (words.length >= 4) {
                                if (!commandperms.hasOwnProperty(commandName)) commandperms[commandName] = {};
                                let allow = parseInt(words[3]);
                                if (!isNaN(allow)) {
                                    commandperms[commandName].permission = allow;
                                    changedCommands.push(commandName);
                                } else {
                                    bu.send(msg.channel.id, `The permissions must be in a numeric format. See <https://discordapi.com/permissions.html> for more details.`);
                                    return;
                                }
                            }
                        }
                    } else {
                        if (commands.length == 1) { bu.send(msg.channel.id, `That's not a command!`); break; }
                    }
                }
                await bu.r.table('guild').get(msg.channel.guild.id).update({
                    commandperms: commandperms
                }).run();
                bu.send(msg.channel.id, toSend + changedCommands.join(', ') + '\n```');
                break;
            default:
                bu.send(msg.channel.id, e.info);
                break;
        }
    } else {
        bu.send(msg.channel.id, 'Not enough arguments provided!');
    }

};