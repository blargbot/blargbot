var e = module.exports = {};
var bu;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'help [command]';
e.info = 'Gets a list of command or specific command help.';
e.longinfo = `<p>Returns a list of commands and custom commands. If a command name is specified, it will return a description
        of that command instead.</p>`;

e.execute = async((msg, words) => {
    if (words.length > 1) {
        var message = '';
        if (bu.commandList.hasOwnProperty(words[1]) && !bu.commandList[words[1]].hidden) {
            message = `Command Name: ${bu.commandList[words[1]].name}
Usage: \`${bu.commandList[words[1]].usage}\`
${bu.commandList[words[1]].info}`;
        } else {
            message = `No description could be found for command \`${words[1]}\`.`;
        }
        bu.sendMessageToDiscord(msg.channel.id, message);
    } else {
        var commandsString = '```prolog\nGeneral Commands:\n  ';
        var generalCommands = [];
        var otherCommands = {};
        var modifiedCommands = [];
        let storedGuild = await(bu.r.table('guild').get(msg.channel.guild.id).run());
        let customizedCommands = storedGuild.commandperms;
    //    bu.logger.debug(customizedCommands);
        for (let key in customizedCommands) {
            if (customizedCommands[key].rolename != null)
                for (let i = 0; i < customizedCommands[key].rolename.length; i++) {
                    if (!otherCommands[customizedCommands[key].rolename[i].toLowerCase()]) {
                        otherCommands[customizedCommands[key].rolename[i].toLowerCase()] = [];
                    }
                    otherCommands[customizedCommands[key].rolename[i].toLowerCase()]
                        .push(key);
                    modifiedCommands.push(key);
                }
        }
    //    bu.logger.debug(modifiedCommands);
     //   bu.logger.debug(otherCommands);
        for (var command in bu.commandList) {
            if (modifiedCommands.indexOf(command) == -1)
                if (!bu.commandList[command].hidden) {
                    if (bu.commandList[command].category == bu.CommandType.GENERAL) {
                        generalCommands.push(command);
                    }
                    else {
                        if (!otherCommands[bu.commandList[command].category])
                            otherCommands[bu.commandList[command].category] = [];
                        otherCommands[bu.commandList[command].category].push(command);
                    }
                }
        }
        generalCommands.sort();
        commandsString += generalCommands.join(', ');

        var onComplete = async(function () {
            let ccommands = storedGuild.ccommands;
      //      bu.logger.debug(ccommands);
            if (ccommands && Object.keys(ccommands).length > 0) {
                var ccommandsString = 'Custom Commands:\n  ';
                var helpCommandList = [];
                for (var key in ccommands) {
                    helpCommandList.push(key);
                }
                helpCommandList.sort();
                ccommandsString += helpCommandList.join(', ');
                commandsString += `\n${ccommandsString}`;
            }

            commandsString += '```';
            let dmhelp = await(bu.guildSettings.get(msg.channel.guild.id, 'dmhelp'));
            let doDM = dmhelp && dmhelp != 0;
            let sendString = `${doDM ? `Here are your commands for ${msg.channel.guild.name}.\n` : ''}${commandsString}\n${!msg.channel.guild
                ? 'Not all of these bu.commands work in DMs.\n'
                : ''
                }For more information about bu.commands, do \`help <commandname>\` or visit https://blargbot.xyz/commands`

            if (doDM) {
                bot.getDMChannel(msg.author.id).then(pc => {
                    bu.send(msg.channel.id, '📧 DMing you a list of commands 📧');
                    bu.send(pc.id, sendString);
                });
            } else {
                bu.send(msg.channel.id, sendString);
            }
        });

        function nextCommand(category, completeCommandList) {
            if (!bu.CommandType.properties.hasOwnProperty(category)
                || bu.CommandType.properties[category].requirement(msg)) {
                if (completeCommandList.length > 0) {
                    completeCommandList.sort();
                    commandsString += `\n${bu.CommandType.properties.hasOwnProperty(category)
                        ? bu.CommandType.properties[category].name
                        : category.charAt(0).toUpperCase() + category.slice(1)} Commands:\n  `;
                    commandsString += completeCommandList.join(', ');
                }
            }
            i++;
            completeCommandList.length = 0;
            processCategory(i);
        }
        let completeCommandList = []
            , category
            , counter
            , i = 0
            , ii;

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
                    bu.canExecuteCommand(msg, otherCommands[category][ii], true).then(doThing);
                }
                //    }
            }
        }
        processCategory(i);
    }
});
