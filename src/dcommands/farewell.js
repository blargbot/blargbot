const BaseCommand = require('../structures/BaseCommand'),
    bbEngine = require('../structures/BBTagEngine');

class FarewellCommand extends BaseCommand {
    constructor() {
        super({
            name: 'farewell',
            category: bu.CommandType.ADMIN,
            usage: 'farewell [message]',
            info: 'Sets a farewell message for when users leave.',
            flags: [{
                flag: 'c',
                word: 'channel',
                desc: 'The channel to put the farewell messages in.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        if (input.undefined.length == 0) {
            bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(() => {
                bu.send(msg, 'Disabled farewells');
            });
            return;
        }
        var farewell = input.undefined.join(' ');
        await bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell);
        let suffix = '';
        let channelStr = input.c ? input.c.join(' ') : msg.channel.id;
        if (/[0-9]{17,23}/.test(channelStr)) {
            let channel = channelStr.match(/([0-9]{17,23})/)[1];
            if (!bot.getChannel(channel)) {
                suffix = `A channel could not be found from the channel input, so this message will go into the default channel. `;
            } else if (bot.channelGuildMap[channel] != msg.guild.id) {
                suffix = `The channel must be on this guild! `;
            } else {
                await bu.guildSettings.set(msg.guild.id, 'farewellchan', channel);
                suffix = `This farewell will be outputted in <#${channel}>. `;
            }
        }
        await bbEngine.runTag({
            msg,
            tagContent: farewell,
            input: '',
            isCC: true,
            author: msg.author,
            modResult(context, result) { return 'Farewell set. ' + suffix + 'Simulation:\n' + result; }
        });
    }
}

module.exports = FarewellCommand;
