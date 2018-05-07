const BaseCommand = require('../structures/BaseCommand');

class EditcommandCommand extends BaseCommand {
    constructor() {
        super({
            name: 'editcommand',
            category: bu.CommandType.ADMIN,
            usage: 'editcommand < list \n    | setrole <commandname | "commandname,..."> [role name]... \n    | setperm <commandname | "commandname,..."> [perm number] \n    | toggle <commandname | "commandname,...">',
            info: 'Changes command-specific usage permissions.\n\n**list** \nShows a list of modified commands (role required/perms required)\n\n**setrole**\nSets the role(s) required in order to use the command(s). Set to blank to disable the custom role requirement.\n\n**setperm** \nSets the permissions required in order to bypass the role requirement (requires `permoverride` in the settings command to be enabled). This has to be a permission number, which can be calculated at <https://discordapi.com/permissions.html>. Set to blank to disable the custom permission options.\n\n**toggle** \nEnables/disables the listed commands'
        });
    }

    async execute(msg, words, text) {
        if (words.length >= 2) {
            let commandName;
            let storedGuild;
            storedGuild = await bu.getGuild(msg.guild.id);
            let commandperms = storedGuild.commandperms;
            let allcommands = Object.keys(CommandManager.list);
            for (const key in commandperms) {
                if (!allcommands.includes(key))
                    delete commandperms[key];
            }
            if (!commandperms) commandperms = {};
            let commands, toSend, changedCommands = [];
            switch (words[1].toLowerCase()) {
                case 'list':
                    let message = '__Modified Commands:__\n';
                    let commandList = [];
                    for (let key in commandperms) {
                        if (commandperms[key].rolename || commandperms[key].permission || commandperms[key].disabled)
                            commandList.push(`**${key}** ${commandperms[key].rolename
                                ? '\n   __Role__: ' + commandperms[key].rolename
                                : ''}${commandperms[key].permission
                                    ? '\n   __Perm__: ' + commandperms[key].permission
                                    : ''}${commandperms[key].disabled
                                        ? '\n   __DISABLED__'
                                        : ''}`);
                    }
                    if (commandList.length > 0) message += commandList.join('\n');
                    else message += 'No modified commands found.';
                    bu.send(msg, message);
                    break;
                case 'setrole':
                    if (!words[2]) {
                        bu.send(msg, 'Not enough arguments provided!');
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
                        if (CommandManager.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                            commandName = CommandManager.commandList[commands[i].toLowerCase()].name;
                            if (CommandManager.list[commandName].category == bu.CommandType.CAT ||
                                CommandManager.list[commandName].category == bu.CommandType.MUSIC) {
                                console.debug('no ur not allowed');
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
                            if (commands.length == 1) {
                                bu.send(msg, `That's not a command!`);
                                break;
                            }
                        }
                    }
                    await r.table('guild').get(msg.channel.guild.id).update({
                        commandperms: commandperms
                    }).run();
                    bu.send(msg, toSend + changedCommands.join(', ') + '\n```');
                    break;
                case 'toggle':
                    if (!words[2]) {
                        bu.send(msg, 'Not enough arguments provided!');
                        break;
                    }
                    commands = words[2].toLowerCase().split(/\s*,\s*/);
                    let disabledList = [];
                    let enabledList = [];
                    for (let i = 0; i < commands.length; i++) {
                        if (CommandManager.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                            commandName = CommandManager.commandList[commands[i].toLowerCase()].name;
                            if (CommandManager.list[commandName].category == bu.CommandType.CAT ||
                                CommandManager.list[commandName].category == bu.CommandType.MUSIC ||
                                CommandManager.list[commandName].cannotDisable === true) {
                                console.debug('no ur not allowed');
                            } else {
                                console.debug(commandperms[commandName]);
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
                            if (commands.length == 1) {
                                bu.send(msg, `That's not a command!`);
                                break;
                            }
                        }
                    }
                    await r.table('guild').get(msg.channel.guild.id).update({
                        commandperms: commandperms
                    }).run();
                    bu.send(msg, dep.util.format('Commands enabled:\n```\n%s \n```\nCommands disabled:\n```\n%s \n```', enabledList.join(', '), disabledList.join(', ')));
                    break;
                case 'setperm':
                    if (!words[2]) {
                        bu.send(msg, 'Not enough arguments provided!');
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
                        if (CommandManager.commandList.hasOwnProperty(commands[i].toLowerCase())) {
                            commandName = CommandManager.commandList[commands[i].toLowerCase()].name;
                            if (CommandManager.list[commandName].category == bu.CommandType.CAT ||
                                CommandManager.list[commandName].category == bu.CommandType.MUSIC) {
                                console.debug('no ur not allowed');
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
                                        bu.send(msg, `The permissions must be in a numeric format. See <https://discordapi.com/permissions.html> for more details.`);
                                        return;
                                    }
                                }
                            }
                        } else {
                            if (commands.length == 1) {
                                bu.send(msg, `That's not a command!`);
                                break;
                            }
                        }
                    }
                    await r.table('guild').get(msg.channel.guild.id).update({
                        commandperms: commandperms
                    }).run();
                    bu.send(msg, toSend + changedCommands.join(', ') + '\n```');
                    break;
                default:
                    bu.send(msg, e.info);
                    break;
            }
            storedGuild.commandperms = commandperms;

        } else {
            bu.send(msg, 'Not enough arguments provided!');
        }
    }
}

module.exports = EditcommandCommand;
