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
e.usage = 'suggest <suggestion>';
e.info = 'Sends me a suggestion. Thanks for the feedback!';
e.longinfo = `<p>Sends a suggestion to my guild. Thank you for the feedback! It's very important to me.</p>`;

e.execute = (msg, words, text) => {
    if (words.length > 1) {
        bu.sendMessageToDiscord('195716879237644292', `\`\`\`diff
!== { Suggestion Received } ==!
+ Author: ${msg.author.username} (${msg.author.id})${msg.channel.guild
                ? `\n+ Guild: ${msg.channel.guild.name} (${msg.channel.guild.id})
+ Channel: ${msg.channel.name} (${msg.channel.id})` : ''}
- Message: ${text.replace(`${words[0]} `, '').replace(/`/g, '`\u200b').replace(/\n/g, '\n- ')}
\`\`\``);
        bu.sendMessageToDiscord(msg.channel.id, 'Suggestion sent! :ok_hand:');
    }
};