const BaseCommand = require('../structures/BaseCommand');
const stringify = BaseCommand.stringify;
const moment = require('moment-timezone');

class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: 'help',
            category: bu.CommandType.GENERAL,
            usage: 'help [command]',
            info: 'Gets a list of command or specific command help.'
        });
    }

    getColor(category) {
        switch (category) {
            case bu.CommandType.CAT:
            case bu.CommandType.DEVELOPER:
            case bu.CommandType.ADMIN: return 0xff0000;
            case bu.CommandType.NSFW: return 0x010101;
            case bu.CommandType.IMAGE:
            case bu.CommandType.GENERAL: return 0xefff00;
            default: return 0x7289da;
        }
    }

    async execute(msg, words, text) {
        if (words.length > 1) {
            let embed = {
                fields: [],
                get asString() {
                    return stringify(this);
                }
            };
            const customCommand = await bu.ccommand.get(msg.guild.id, words[1]);
            if (customCommand) {
                const helpText = customCommand.help;
                if (helpText) {
                    embed.color = this.getColor('CUSTOM');
                    embed.title = `Help for ${words[1].toLowerCase()} (Custom Command)`;
                    embed.description = helpText;
                }
            } else {
                if (CommandManager.commandList.hasOwnProperty(words[1]) && !CommandManager.commandList[words[1]].hidden
                && (!CommandManager.commandList[words[1]].onlyOn || CommandManager.commandList[words[1]].onlyOn === msg.guild.id)) {
                    const instance = CommandManager.built[CommandManager.commandList[words[1]].name];
                    const definition = CommandManager.commandList[words[1]];
                    embed.title = `Help for ${definition.name}`;
                    embed.url = `https://blargbot.xyz/commands#${definition.name}`;
                    embed.description = `**__Usage__**:\`${definition.usage}\`\n${definition.info}`;
                    embed.color = this.getColor(instance.category);
                    if (instance.aliases && instance.aliases.length > 0)
                        embed.fields.push({
                            name: '**Aliases**',
                            value: instance.aliases.join(', ')
                        });
                    if (instance.flags && instance.flags.length > 0)
                        embed.fields.push({
                            name: '**Flags**',
                            value: instance.flags.map(flag => `\`-${flag.flag}\` or \`--${flag.word}\` - ${flag.desc}`).join('\n')
                        });
                }
            }
            if (!embed.title)
                bu.send(msg, `No description could be found for command \`${words[1]}\`.`);
            else
                bu.send(msg, { embed });
        } else {
            let embed = {
                fields: [],
                get asString() {
                    return stringify(this);
                }
            };
            embed.color = this.getColor('CUSTOM');
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
                    if (!CommandManager.commandList.hasOwnProperty(key)) continue;
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
            for (var command in CommandManager.built) {
                if (modifiedCommands.indexOf(command) == -1)
                    if (!CommandManager.built[command].hidden && (!CommandManager.built[command].onlyOn || (msg.guild && CommandManager.built[command].onlyOn === msg.guild.id))) {
                        if (CommandManager.built[command].category == bu.CommandType.GENERAL) {
                            if ((await bu.canExecuteCommand(msg, command, true, { storedGuild, permOverride, staffPerms })).executable)
                                generalCommands.push(command);
                        } else {
                            let category = CommandManager.built[command].category;
                            if (!otherCommands[CommandManager.built[command].category])
                                otherCommands[CommandManager.built[command].category] = [];
                            otherCommands[CommandManager.built[command].category].push(command);
                        }
                    }
            }
            generalCommands.sort();
            embed.fields.push({
                name: 'General Commands',
                value: '```\n' + generalCommands.join(', ') + '\n```'
            });

            var onComplete = async () => {
                if (msg.channel.guild) {
                    let ccommands = storedGuild.ccommands;
                    //      console.debug(ccommands);
                    if (ccommands && Object.keys(ccommands).length > 0) {
                        var helpCommandList = [];
                        for (var key in ccommands) {
                            if (await bu.canExecuteCcommand(msg, key, true))
                                helpCommandList.push(key);
                        }
                        helpCommandList.sort();
                        const sections = [];
                        var section = {
                            name: 'Custom Commands',
                            value: '```\n'
                        };
                        for (var i = 0; i < helpCommandList.length; i++) {
                            if (i === 0) {
                                section.value += helpCommandList[i];
                                continue;
                            }

                            if ((section.value + ', ' + helpCommandList[i]).length < 1020) {
                                section.value += ', ' + helpCommandList[i];
                            } else {
                                section.value += '\n```';
                                sections.push(section);
                                section = {
                                    name: '\u200b',
                                    value: '```\n' + helpCommandList[i]
                                };
                            }
                        }
                        section.value += '\n```';
                        sections.push(section);
                        embed.fields.push(...sections);
                    }
                }

                let prefix = '';
                let finalText = '';
                if (!msg.channel.guild)
                    finalText += 'Not all of these commands will work in DM\'s\n';
                else {
                    let prefixes = await bu.guildSettings.get(msg.channel.guild.id, 'prefix');
                    prefix = prefixes ? prefixes[0] : config.discord.defaultPrefix;
                }
                finalText += 'For more information about commands, do `' + prefix + 'help <commandname>` or visit <https://blargbot.xyz/commands>.\nWant to support the bot? Consider donating to <https://patreon.com/blargbot> - all donations go directly towards recouping hosting costs.';

                embed.fields.push({
                    name: '\u200B',
                    value: finalText
                });

                await this.sendHelp(msg, { embed }, 'commands');
            };

            function nextCommand(category, completeCommandList) {
                if (!bu.CommandType.properties.hasOwnProperty(category) ||
                    bu.CommandType.properties[category].requirement(msg, storedGuild)) {
                    if (completeCommandList.length > 0) {
                        completeCommandList.sort();
                        let categoryString = '';
                        if (bu.CommandType.properties.hasOwnProperty(category)) {
                            if (category == bu.CommandType.ADMIN && adminRole)
                                categoryString = adminRole;
                            else categoryString = bu.CommandType.properties[category].name;
                        } else categoryString = category;
                        embed.fields.push({
                            name: `${categoryString.charAt(0).toUpperCase() + categoryString.slice(1)} Commands`,
                            value: '```\n' + completeCommandList.join(', ') + '\n```'
                        });
                    }
                }
                i++;
                completeCommandList.length = 0;
                processCategory(i);
            }
            let completeCommandList = [],
                category, counter, i = 0,
                ii;

            function doThing({ executable, name }) {
                if (executable) {
                    completeCommandList.push(name);
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
                        bu.canExecuteCommand(msg, otherCommands[category][ii], true, { storedGuild, permOverride, staffPerms }).then(doThing);
                    }
                    //    }
                }
            }
            processCategory(i);
        }
    }

    async sendHelp(msg, message, type, isPlural = false) {
        if (typeof message != 'object')
            message = { content: message };

        if (msg.channel.guild && await bu.guildSettings.get(msg.channel.guild.id, 'dmhelp')) {
            let dmChannel = await bot.getDMChannel(msg.author.id);
            await bu.send(msg, '📧 DMing you the ' + type + ' 📧');
            message.content = 'Here ' + (isPlural ? 'are' : 'is') + ' the ' + type + ' you requested in <#' + msg.channel.id + '>\n' + (message.content || '');
            await bu.send(dmChannel.id, message);
        } else
            await bu.send(msg, message);
    };

}

module.exports = HelpCommand;
