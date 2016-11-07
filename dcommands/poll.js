var e = module.exports = {};
const moment = require('moment');
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'poll <question> [duration] [emoji]...';
e.info = 'Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.';
e.longinfo = `<p>Creates a poll for the given question and duration. If emojis are given, they will be used as options for the poll.`;

e.execute = async function(msg, words) {
    let choices = ['👍', '👎'];
    if (words.length >= 2) {
        if (!words[2]) words[2] = 60;
        if (words.length > 3) {
            choices = words.slice(3);
        }
        let time = parseInt(words[2]);
        if (isNaN(time)) {
            bu.send(msg, 'Invalid duration!');
            return;
        }
        time *= 1000;
        let message = `**__${words[1]}__**\n\nThe poll will expire ${moment.duration(time).humanize(true)}.\n\nVote here:`;

        let msg2 = await bu.send(msg, message);
        for (let choice of choices) {
            choice = choice.replace(/>/g, '').replace(/</g, '');
            try {
                await bot.addMessageReaction(msg2.channel.id, msg2.id, encodeURIComponent(choice));
            } catch (err) {
                //NO-OP
                //   logger.error(err);
            }
        }
        let endTime = moment(msg.timestamp).add(time);
        await r.table('events').insert({
            title: words[1],
            type: 'poll',
            channel: msg.channel.id,
            msg: msg2.id,
            endtime: r.epochTime(endTime.unix())
        });

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
        bu.send(args.channel, `**__${args.title}__**\nThe results are in! It was a tie between these choices, at **${max}** vote${max == 1 ? '' : 's'} each:
${winnerString}

A total of **${totalVotes}** vote${totalVotes == 1 ? '' : 's'} were collected!`);
    } else {
        bu.send(args.channel, `**__${args.title}__**\nThe results are in! At **${max}** vote${max == 1 ? '' : 's'}, the winner is:
${winnerString}

A total of **${totalVotes}** vote${totalVotes == 1 ? '' : 's'} were collected!`);
    }
};