var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'roll [dice] [modifier]';
e.info = 'Rolls an amount of dice (ex. 1d20) and adds the modifier.';
e.longinfo = `<p>Rolls dice and adds a modifier. You can specify the number of dice and how many sides they have with the notation
        <code>XdY</code>, where X is number of dice and Y is number of sides. If no dice are specified, it defaults to
        <code>1d20</code>.</p>`;

e.execute = (msg, words) => {
    var message = ``;
    // if (bot === BotEnum.DISCORD) {
    message += `**${msg.author.username}**, `;
    // } else if (bot === BotEnum.IRC) {
    //   message += `${user}, `;
    // }
    message += `Rolling `;
    var max = 20
        , rollList = []
        , i
        , total;

    if (words.length > 1) {
        if (words[1].indexOf('cat') > -1) {
            var catUrl;
            var seed = bu.getRandomInt(0, 3);
            console.log(`The cat chosen is ${seed} `);
            switch (seed) {
                case 0:
                    catUrl = 'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif';
                    break;
                case 1:
                    catUrl = 'http://random.cat/i/024_-_H1NMbQr.gif';
                    break;
                case 2:
                    catUrl = 'http://random.cat/i/081_-_DWzDbUH.gif';
                    break;
                default:
                    catUrl = 'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif';
                    break;
            }
            bu.sendMessageToDiscord(msg.channel.id, catUrl);
            return;
        }
        if (words[1].indexOf('rick') > -1) {
            bu.sendMessageToDiscord(msg.channel.id, 'http://static.celebuzz.com/uploads/2015/08/rick-roll-82415-1.gif');
            return;
        }
        if (words[1] == 'character') {
            //  sendMessageToDiscord(channel, 'So you want to roll a character, huh?', bot);
            message = 'Rolling a character:\n```xl\n';
            for (var ii = 0; ii < 6; ii++) {
                message += `Stat #${ii + 1} - [`;
                var rolls = [];
                for (i = 0; i < 4; i++) {
                    var roll = bu.getRandomInt(1, 6);
                    rolls.push(roll);
                    message += `${roll}, `;
                }
                rolls.sort();
                total = 0;
                for (i = 0; i < rolls.length; i++) {
                    total += rolls[i];
                }
                var newtotal = total - rolls[0];
                message = `${message.substring(0, message.length - 2)}] > ${total < 10 && total > -10 ? ` ${total}` : total} - ${rolls[0]} > ${newtotal < 10 && newtotal > -10 ? ` ${newtotal}` : newtotal}\n`;
                console.log(message);
            }
            bu.sendMessageToDiscord(msg.channel.id, `${message}\n\`\`\``);

            return;
        }
        if (words[1].indexOf('d') > -1) {
            var dice = words[1].split('d');
            max = dice[1];
            message += `${dice[0]}d${max}`;
            for (i = 0; i < dice[0]; i++) {
                rollList[i] = bu.getRandomInt(1, max);
            }
        } else {
            max = words[1];
            message += `1d${max}`;
            rollList[0] = bu.getRandomInt(1, max);
        }
    } else {
        max = 20;
        message += `1d${max}`;
        rollList[0] = bu.getRandomInt(1, max);
    }
    message += ` - [`;
    total = 0;
    for (i = 0; i < rollList.length; i++) {
        total += rollList[i];
        message += `${rollList[i]}, `;
    }

    message = message.substring(0, message.length - 2);
    message += `] > ${total}`;

    if (words.length > 2) {
        var newTotal = total + parseInt(words[2]);
        message += ` + ${parseInt(words[2])} > ${newTotal}`;
    }

    if (msg.channel.id !== bu.config.discord.channel) {
        if (rollList.length == 1 && max == 20 && rollList[0] == 20) {
            message += `\`\`\`diff
+ NATURAL 20
\`\`\``;
        } else if (rollList.length == 1 && max > 1 && rollList[0] == 1) {
            message += `\`\`\`diff
- Natural 1...
\`\`\``;
        }
    }
    bu.sendMessageToDiscord(msg.channel.id, message);
};