const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const newbutils = require('../newbu');

class PollCommand extends BaseCommand {
    constructor() {
        super({
            name: 'poll',
            category: newbutils.commandTypes.GENERAL,
            usage: 'poll <question> [flags]',
            info: 'Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.',
            flags: [{
                flag: 't',
                word: 'time',
                desc: 'How long before the poll expires, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'
            },
            {
                flag: 'e',
                word: 'emojis',
                desc: 'The emojis to apply to the poll.'
            },
            {
                flag: 'd',
                word: 'description',
                desc: 'The description of the poll.'
            },
            {
                flag: 'c',
                word: 'colour',
                desc: 'The colour of the poll (in HEX).'
            },
            {
                flag: 'a',
                word: 'announce',
                desc: 'If specified, it will make an announcement. Requires the proper permissions.'
            },
            {
                flag: 's',
                word: 'strict',
                desc: 'If specified, only accept reactions that were in the initial list.'
            }]
        });
    }

    async execute(msg, words, text) {
        let choices = ['👍', '👎'];
        let input = newbutils.parse.flags(this.flags, words, true);
        if (input.undefined.length >= 1) {
            if (input.e) {
                choices = bu.findEmoji(input.e.join(' '), true);
            }
            let time = moment.duration(60, 's');
            if (input.t) {
                time = bu.parseDuration(input.t.join(' '));
            }
            if (time.asMilliseconds() <= 0) {
                bu.send(msg, 'The length of a poll can\'t be less than 0 seconds!');
                return;
            }
            if (!input.c) input.c = [];
            let color = bu.parseColor(input.c[0]);
            if (color === null)
                color = bu.getRandomInt(0, 0xffffff);
            let endTime = moment(msg.timestamp).add(time);
            let title = input.undefined.join(' ');
            let message = {
                embed: {
                    author: {
                        name: title,
                        icon_url: msg.author.avatarURL
                    },
                    footer: {
                        text: 'The poll will expire'
                    },
                    timestamp: endTime,
                    color: color
                }
            };
            if (input.d) {
                message.embed.description = input.d.join(' ');
            }
            let channel = msg.channel.id,
                roleId, role;
            if (input.a) {
                let storedGuild = await bu.getGuild(msg.guild.id);
                if (storedGuild.hasOwnProperty('announce')) {
                    if ((await bu.canExecuteCommand(msg, 'announce', true)).executable) {
                        channel = storedGuild.announce.channel;
                        roleId = storedGuild.announce.role;
                        role = msg.guild.roles.get(roleId);
                        if (!role) {
                            roleId = undefined;
                            role = undefined;
                            channel = msg.channel.id;
                        } else if (role.name == '@everyone') {
                            message.content = '@everyone';
                            message.disableEveryone = false;
                        } else {
                            message.content = role.mention;
                        }
                    }
                }
            }
            if (role) {
                try {
                    await role.edit({
                        mentionable: true
                    });
                } catch (err) {
                    console.error(err);
                }
            }
            let msg2 = await bu.send(channel, message);
            if (role) {
                try {
                    await role.edit({
                        mentionable: false
                    });
                } catch (err) {
                    console.error(err);
                }
            }
            try {
                await bu.addReactions(msg2.channel.id, msg2.id, choices);
            } catch (err) {
                //NO-OP
                //   console.error(err);
            }
            await bu.events.insert({
                source: msg.guild ? msg.guild.id : msg.author.id,
                content: title,
                user: msg.author.id,
                type: 'poll',
                channel: channel,
                msg: msg2.id,
                endtime: r.epochTime(endTime.unix()),
                starttime: r.epochTime(moment().unix()),
                color: color,
                icon: msg.author.avatarURL,
                roleId,
                strict: input.s ? choices.map(m => {
                    if (/[0-9]{17,23}/.test(m))
                        return m.match(/([0-9]{17,23})/)[0];
                    return m;
                }) : undefined
            });
        } else {
            bu.send(msg, 'Incorrect usage! Do `b!help poll` for more information.');
        }
    }

    async event(args) {
        console.debug('poll has been triggered');
        let msg3 = await bot.getMessage(args.channel, args.msg);
        let reactions = [];
        for (let key in msg3.reactions) {
            msg3.reactions[key].emoji = key;
            if (msg3.reactions[key].me) {
                msg3.reactions[key].count--;
            }
            if (args.strict == undefined || (args.strict.includes(key) ||
                (/[0-9]{17,23}/.test(key) ?
                    args.strict.includes(key.match(/([0-9]{17,23})/)[0]) :
                    false)))
                reactions.push(msg3.reactions[key]);
        }
        if (reactions.length == 0) {
            bu.send(args.channel, 'No results were collected!');
            return;
        }
        let totalVotes = 0;
        for (let key in reactions) {
            if (/[0-9]{17,23}/.test(reactions[key].emoji))
                reactions[key].emoji = `<:${reactions[key].emoji}>`;
            totalVotes += reactions[key].count;
        }
        reactions.sort((a, b) => {
            return b.count - a.count;
        });
        let max = reactions[0].count;
        let winners = reactions.filter(r => r.count == max);
        let winnerString = winners.map(r => r.emoji).join(' ');
        console.debug(args.color);
        console.debug(6);
        let middleBit = winners.length > 1 ?
            `It was a tie between these choices, at **${max}** vote${max == 1 ? '' : 's'} each:` :
            `At **${max}** vote${max == 1 ? '' : 's'}, the winner is:`;
        let output = {
            embed: {
                author: {
                    name: args.content,
                    icon_url: args.icon
                },
                color: args.color,
                description: `The results are in! A total of **${totalVotes}** vote${totalVotes == 1 ? '' : 's'} were collected!
     
    ${middleBit}
    
    ${winnerString}`
            }
        };
        let role;
        if (args.roleId) {
            role = msg3.guild.roles.get(args.roleId);
            if (role.id == msg3.guild.id) {
                output.content = '@everyone';
                output.allowedMentions = {
                    everyone: true
                };
            } else {
                output.content = role.mention;
                output.allowedMentions = {
                    roles: role.id
                };
            }
        }
        await bu.send(args.channel, output);
    };
}

module.exports = PollCommand;
