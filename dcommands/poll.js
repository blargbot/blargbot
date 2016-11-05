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

e.execute = async function (msg, words) {
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
            try {
                await bot.addMessageReaction(msg2.channel.id, msg2.id, encodeURIComponent(choice));
            } catch (err) {
                //NO-OP
                logger.error(err);
            }
        }
        setTimeout(async function () {
            let msg3 = await bot.getMessage(msg2.channel.id, msg2.id);
            let reactions = [];
            for (let key in msg3.reactions) {
                msg3.reactions[key].emoji = key;
                reactions.push(msg3.reactions[key]);
            }
            reactions.sort((a, b) => {
                return b.count - a.count;
            });
            let totalVotes = 0;
            for (let reaction of reactions) {
                totalVotes += reaction.count - 1;
            }
            let max = reactions[0].count;
            let winners = reactions.filter(r => r.count == max);
            if (winners.length > 1) {
                bu.send(msg, `The results are in for **${words[1]}**! It was a tie between these choices, at **${max - 1}** vote${max == 1 ? '' : 's'} each:
${winners.map(r => r.emoji).join('')}

A total of **${totalVotes}** were collected!`);
            } else {
                bu.send(msg, `The results are in for **${words[1]}**! At **${max - 1}** vote${max == 1 ? '' : 's'}, the winner is:
${winners[0].emoji}

A total of **${totalVotes}** were collected!`);
            }
        }, time);
    }
};