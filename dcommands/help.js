var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'help [command]';
e.info = 'Gets a list of command or specific command help.';
e.longinfo = `<p>Returns a list of commands and custom commands. If a command name is specified, it will return a description
        of that command instead.</p>`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words) => {
    if (words.length > 1) {
        var message = '';
        if (bu.commandList.hasOwnProperty(words[1]) && !bu.commandList[words[1]].hidden
            && bu.CommandType.properties[bu.commandList[words[1]].category].requirement(msg)) {
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
        for (var command in bu.commandList) {
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
        for (var category in otherCommands) {
            if (bu.CommandType.properties[category].requirement(msg)) {
                otherCommands[category].sort();
                var otherCommandList = otherCommands[category];
                commandsString += `\n${bu.CommandType.properties[category].name} Commands:\n  `;
                commandsString += otherCommandList.join(', ');
            }
        }
        bu.db.query(`select commandname from ccommand where guildid = ?`,
            [msg.channel.guild ? msg.channel.guild.id : ''], (err, rows) => {
                if (rows.length > 0) {
                    var ccommandsString = 'Custom Commands:\n  ';
                    var helpCommandList = [];
                    var i = 0;
                    for (var key in rows) {
                        helpCommandList[i] = rows[key].commandname;
                        i++;
                    }
                    helpCommandList.sort();
                    ccommandsString += helpCommandList.join(', ');
                    commandsString += `\n${ccommandsString}`;
                }

                commandsString += '```';

                bu.sendMessageToDiscord(msg.channel.id, `${commandsString}\n${!msg.channel.guild
                    ? 'Not all of these bu.commands work in DMs.\n'
                    : ''
                    }For more information about bu.commands, do \`help <commandname>\` or visit https://blargbot.xyz/commands`);
            });
    }
};