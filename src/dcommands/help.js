var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'help [command]';
e.info = 'Gets a list of command or specific command help.';
e.longinfo = `<p>Returns a list of commands and custom commands. If a command name is specified, it will return a description
        of that command instead.</p>`;

e.execute = async function (msg, words) {
    if (words.length > 1) {
        var message = '';
        if (CommandManager.commandList.hasOwnProperty(words[1]) && !CommandManager.commandList[words[1]].hidden
            && (!CommandManager.commandList[words[1]].onlyOn || CommandManager.commandList[words[1]].onlyOn === msg.guild.id)) {
            let aliases = '';
            let flags = '';
            if (CommandManager.list[CommandManager.commandList[words[1]].name].alias)
                aliases = `\n**__Aliases__**: [ ${CommandManager.list[CommandManager.commandList[words[1]].name].alias.join(', ')} ]`;
            if (CommandManager.list[CommandManager.commandList[words[1]].name].flags) {
                flags = `**__Flags__**:\n`;
                for (let flag of CommandManager.list[CommandManager.commandList[words[1]].name].flags) {
                    flags += `   \`-${flag.flag}\` or \`--${flag.word}\` - ${flag.desc}\n`;
                }
            }
            message = `**__Command Name__**: ${CommandManager.commandList[words[1]].name}
**__Usage__**: \`${CommandManager.commandList[words[1]].usage}\`${aliases}
${CommandManager.commandList[words[1]].info}

${flags}`;
        } else {
            let ccommand = await bu.ccommand.gethelp(msg.guild.id, words[1]);
            if (ccommand)
                message = `**__Custom Command Name__**: ${words[1].toLowerCase()}\n${ccommand}`;
        }
        if (!message) {
            message = `No description could be found for command \`${words[1]}\`.`;
        }
        bu.send(msg, message);
    } else {
        var commandsString = '```prolog\nGeneral Commands:\n  ';
        var generalCommands = [];
        var otherCommands = {};
        var modifiedCommands = [];
        let storedGuild, permOverride, staffPerms, adminRole;
        if (msg.channel.guild) {
            storedGuild = await bu.getGuild(msg.guild.id);
            permOverride = await bu.guildSettings.get(msg.channel.guild.id, 'permoverride');
            staffPerms = await bu.guildSettings.get(msg.channel.guild.id, 'staffPerms');
            adminRole = storedGuild.settings.adminrole;
            let customizedCommands = storedGuild.commandperms;
            //    console.debug(customizedCommands);
            for (let key in customizedCommands) {
                if (customizedCommands[key].rolename != null)
                    for (let i = 0; i < customizedCommands[key].rolename.length; i++) {
                        if (!otherCommands[customizedCommands[key].rolename[i].toLowerCase()]) {
                            console.debug('creating an entry for', customizedCommands[key].rolename[i].toLowerCase());
                            otherCommands[customizedCommands[key].rolename[i].toLowerCase()] = [];
                        }
                        otherCommands[customizedCommands[key].rolename[i].toLowerCase()]
                            .push(key);
                        modifiedCommands.push(key);
                    }
            }
            console.debug(customizedCommands);
        }
        //    console.debug(modifiedCommands);
        //   console.debug(otherCommands);
        for (var command in CommandManager.list) {
            if (modifiedCommands.indexOf(command) == -1)
                if (!CommandManager.list[command].hidden && (!CommandManager.list[command].onlyOn || CommandManager.list[command].onlyOn === msg.guild.id)) {
                    if (CommandManager.list[command].category == bu.CommandType.GENERAL) {
                        if ((await bu.canExecuteCommand(msg, command, true))[0])
                            generalCommands.push(command);
                    } else {
                        let category = CommandManager.list[command].category;
                        if (!otherCommands[CommandManager.list[command].category])
                            otherCommands[CommandManager.list[command].category] = [];
                        otherCommands[CommandManager.list[command].category].push(command);
                    }
                }
        }
        generalCommands.sort();
        commandsString += generalCommands.join(', ');

        var onComplete = async function () {
            if (msg.channel.guild) {
                let ccommands = storedGuild.ccommands;
                //      console.debug(ccommands);
                if (ccommands && Object.keys(ccommands).length > 0) {
                    var ccommandsString = 'Custom Commands:\n  ';
                    var helpCommandList = [];
                    for (var key in ccommands) {
                        if (await bu.canExecuteCcommand(msg, key, true))
                            helpCommandList.push(key);
                    }
                    helpCommandList.sort();
                    ccommandsString += helpCommandList.join(', ');
                    commandsString += `\n${ccommandsString}`;
                }
            }

            commandsString += '```';
            let prefix = '';
            if (!msg.channel.guild)
                commandsString += 'Not all of these commands will work in DM\'s\n';
            else
                prefix = await bu.guildSettings.get(msg.channel.guild.id, 'prefix') || config.discord.defaultPrefix;
            commandsString += 'For more information about commands, do `'+prefix+'help <commandname>` or visit <https://blargbot.xyz/commands>';

            await e.sendHelp(msg, commandsString, 'commands');
        };

        function nextCommand(category, completeCommandList) {
            if (!bu.CommandType.properties.hasOwnProperty(category) ||
                bu.CommandType.properties[category].requirement(msg)) {
                if (completeCommandList.length > 0) {
                    completeCommandList.sort();
                    let categoryString = '';
                    if (bu.CommandType.properties.hasOwnProperty(category)) {
                        if (category == bu.CommandType.ADMIN && adminRole)
                            categoryString = adminRole;
                        else categoryString = bu.CommandType.properties[category].name;
                    } else categoryString = category;
                    commandsString += `\n${categoryString.charAt(0).toUpperCase() + categoryString.slice(1)} Commands:\n  `;
                    commandsString += completeCommandList.join(', ');
                }
            }
            i++;
            completeCommandList.length = 0;
            processCategory(i);
        }
        let completeCommandList = [],
            category, counter, i = 0,
            ii;

        function doThing(val) {
            if (val[0]) {
                completeCommandList.push(val[1]);
            }
            if (--counter == 0) {
                nextCommand(category, completeCommandList);
            }
        }

        function processCategory() {
            if (i == Object.keys(otherCommands).length) {
                onComplete();
            } else {
                category = Object.keys(otherCommands)[i];
                //    if (!bu.CommandType.properties.hasOwnProperty(category) || bu.CommandType.properties[category].requirement(msg)) {
                //otherCommands[category].sort();
                counter = otherCommands[category].length;
                for (ii = 0; ii < otherCommands[category].length; ii++) {
                    bu.canExecuteCommand(msg, otherCommands[category][ii], true, storedGuild, permOverride, staffPerms).then(doThing);
                }
                //    }
            }
        }
        processCategory(i);
    }
};

e.sendHelp = async function (msg, message, type, isPlural = false) {
    if (typeof message != 'object')
        message = { content: message };

    if (msg.channel.guild && await bu.guildSettings.get(msg.channel.guild.id, 'dmhelp')) {
        let dmChannel = await bot.getDMChannel(msg.author.id);
        await bu.send(msg, '📧 DMing you the ' + type + ' 📧');
        message.content = 'Here '+(isPlural ? 'are' : 'is')+' the ' + type + ' you requested in <#' + msg.channel.id + '>\n' + message.content;
        await bu.send(dmChannel.id, message);
    } else
        await bu.send(msg, message);
};
