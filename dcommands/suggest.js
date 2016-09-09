var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'suggest <suggestion>';
e.info = 'Sends me a suggestion. Thanks for the feedback!';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    if (words.length > 1) {
        bu.sendMessageToDiscord("195716879237644292", `\`\`\`diff
!== { Suggestion Received } ==!
+ Author: ${msg.author.username} (${msg.author.id})
+ Guild: ${msg.channel.guild.name} (${msg.channel.guild.id})
+ Channel: ${msg.channel.name} (${msg.channel.id})
- Message: ${text.replace(`${words[0]} `, '').replace(/`/g, '`\u200b').replace(/\n/g, '\n- ')}
\`\`\``);
        bu.sendMessageToDiscord(msg.channel.id, "Suggestion sent! :ok_hand:");
    }
};