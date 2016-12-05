var e = module.exports = {};
const moment = require('moment');
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'poll <question> [flags]';
e.info = 'Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.';
e.longinfo = `<p>Creates a poll for the given question and duration. If emojis are given, they will be used as options for the poll.`;

e.flags = [{
    flag: 't',
    word: 'time',
    desc: `How long before the poll expires, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`
}, {
    flag: 'e',
    word: 'emojis',
    desc: `The emojis to apply to the poll.`
}];

e.execute = async function(msg, words) {
    let choices = ['👍', '👎'];
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length >= 1) {
        if (input.e) {
            choices = input.e;
        }
        let time = moment.duration(60, 's');
        if (input.t) {
            time = bu.parseDuration(input.t.join(' '));
        }
        if (time.asMilliseconds() <= 0) {
            bu.send(msg, `The length of a poll can't be less than 0 seconds!`);
            return;
        }
        let title = input.undefined.join(' ');
        let message = `**__${title}__**\n\nThe poll will expire ${time.humanize(true)}.\n\nVote here:`;

        let msg2 = await bu.send(msg, message);
        for (let choice of choices) {
            choice = choice.replace(/[<>]/g, '');
            try {
                await bot.addMessageReaction(msg2.channel.id, msg2.id, choice);
            } catch (err) {
                //NO-OP
                //   logger.error(err);
            }
        }
        let endTime = moment(msg.timestamp).add(time);
        await r.table('events').insert({
            title: title,
            type: 'poll',
            channel: msg.channel.id,
            msg: msg2.id,
            endtime: r.epochTime(endTime.unix())
        });
    } else {
        bu.send(msg, 'Incorrect usage! Do `b!help poll` for more information.');
    }
};

e.event = async function(args) {
    let msg3 = await bot.getMessage(args.channel, args.msg);
    let reactions = [];
    for (let key in msg3.reactions) {
        msg3.reactions[key].emoji = key;
        if (msg3.reactions[key].me) {
            msg3.reactions[key].count--;
        }
        reactions.push(msg3.reactions[key]);
    }
    if (reactions.length == 0) {
        bu.send(args.channel, 'No results were collected!');
        return;
    }
    let totalVotes = 0;
    for (let key in reactions) {
        if (/\d/.test(reactions[key].emoji))
            reactions[key].emoji = `<:${reactions[key].emoji}>`;
        totalVotes += reactions[key].count;
    }
    reactions.sort((a, b) => {
        return b.count - a.count;
    });
    let max = reactions[0].count;
    let winners = reactions.filter(r => r.count == max);
    let winnerString = winners.map(r => r.emoji).join(' ');
    if (winners.length > 1) {
        bu.send(args.channel, {
            content: `**__${args.title}__**\nThe results are in! A total of **${totalVotes}** vote${totalVotes == 1 ? '' : 's'} were collected!

It was a tie between these choices, at **${max}** vote${max == 1 ? '' : 's'} each:`,
            embed: {
                description: winnerString
            }
        });
    } else {
        bu.send(args.channel, {
            content: `**__${args.title}__**\nThe results are in! A total of **${totalVotes}** vote${totalVotes == 1 ? '' : 's'} were collected!
            
At **${max}** vote${max == 1 ? '' : 's'}, the winner is:`,
            embed: {
                description: winnerString
            }
        });
    }
};