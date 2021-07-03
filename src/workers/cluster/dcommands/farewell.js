const BaseCommand = require('../structures/BaseCommand'),
    bbEngine = require('../structures/bbtag/Engine');
const newbutils = require('../newbu');

class FarewellCommand extends BaseCommand {
    constructor() {
        super({
            name: 'farewell',
            category: newbutils.commandTypes.ADMIN,
            usage: 'farewell [message]',
            info: 'Sets a farewell message for when users leave.',
            flags: [{
                flag: 'c',
                word: 'channel',
                desc: 'The channel to put the farewell messages in.'
            }, {
                flag: 'r',
                word: 'raw',
                desc: 'Gets the code from the currently-set greeting.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = newbutils.parse.flags(this.flags, words);

        if (input.r) {
            let g = await r.table('guild').get(msg.channel.guild.id);
            let farewell = g.settings.farewell;
            let channel = g.settings.farewellchan;
            return await bu.send(msg, `The farewell is set in <#${channel}>.`, { file: farewell, name: 'farewell.bbtag' });
        }

        if (input.undefined.length == 0) {
            bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(() => {
                bu.send(msg, 'Disabled farewells');
            });
            return;
        }
        var farewell = { content: input.undefined.join(' '), author: msg.author.id, authorizer: msg.author.id };
        await bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell);
        let suffix = '';
        let channelStr = input.c ? input.c.join(' ') : msg.channel.id;
        if (/[0-9]{17,23}/.test(channelStr)) {
            let channel = channelStr.match(/([0-9]{17,23})/)[1];
            if (!bot.getChannel(channel)) {
                suffix = 'A channel could not be found from the channel input, so this message will go into the default channel. ';
            } else if (bot.channelGuildMap[channel] != msg.guild.id) {
                suffix = 'The channel must be on this guild! ';
            } else {
                await bu.guildSettings.set(msg.guild.id, 'farewellchan', channel);
                suffix = `This farewell will be outputted in <#${channel}>. `;
            }
        }
        await bbEngine.runTag({
            msg,
            limits: new bbtag.limits.ccommand(),
            tagContent: farewell.content,
            input: '',
            isCC: true,
            author: msg.author.id,
            authorizer: msg.author.id,
            outputModify(_, result) { return 'Farewell set. ' + suffix + 'Simulation:\n' + result; }
        });
    }
}

module.exports = FarewellCommand;
