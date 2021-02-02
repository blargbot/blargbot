const BaseCommand = require('../structures/BaseCommand');
const { parse, commandTypes, modlogColours } = require('../newbu');

class WarnCommand extends BaseCommand {
    constructor() {
        super({
            name: 'warn',
            category: commandTypes.ADMIN,
            usage: 'warn <user> [flags]',
            info: 'Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.',
            flags: [{
                flag: 'r',
                word: 'reason',
                desc: 'The reason for the warning.'
            },
            {
                flag: 'c',
                word: 'count',
                desc: 'The number of warnings that will be issued.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = parse.flags(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, 'Not enough input. Do `b!help warn` for usage instructions.');
            return;
        }
        let user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        let count = 1;
        if (input.c && input.c.length > 0) {
            let tempCount = parseInt(input.c[0]);
            if (!isNaN(tempCount)) count = tempCount;
        }
        let res = await bu.issueWarning(user, msg.guild, count);
        await bu.logAction(msg.guild, user, msg.author, 'Warning', input.r, modlogColours.WARN, [{
            name: 'Warnings',
            value: `Assigned: ${count}\nNew Total: ${res.count || 0}`,
            inline: true
        }]);

        let furtherAction = '';
        if (res.error) {
            furtherAction = `⛔ This should have resulted in a ${res.type == 1 ? 'ban' : 'kick'} however `;
            switch (res.error.code) {
                case 50013: // Missing Permissions
                    furtherAction += 'I do not have permission to do that.';
                    break;
                default:
                    furtherAction += `Discord returned a ${res.error.code} error when I attempted to do that.`;
                    break;
            }
        } else {
            switch (res.type) {
                case 1: furtherAction = `**${user}** went over the warning limit for bans and so was banned from the server.`; break;
                case 2: furtherAction = `**${user}** went over the warning limit for kicks and so was kicked from the server.`; break;
            }
        }

        bu.send(msg, `:ok_hand: **${bu.getFullName(user)
            }** has been given ${count == 1 ? 'a warning' : count + ' warnings'
            }. They now have ${res.count
            } warning${res.count == 1 ? '' : 's'
            }.\n${furtherAction}`);
    }
}

module.exports = WarnCommand;
