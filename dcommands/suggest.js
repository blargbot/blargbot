var e = module.exports = {};
var bu;
const Trello = require('node-trello');
var t;

const async = require('asyncawait/async');
const await = require('asyncawait/await');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
    t = new Trello(bu.config.general.trellokey, bu.config.general.trellotoken);

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'suggest <suggestion>';
e.info = 'Sends me a suggestion. Thanks for the feedback!';
e.longinfo = `<p>Sends a suggestion to my guild. Thank you for the feedback! It's very important to me.</p>`;

e.execute = async((msg, words) => {
    if (words.length > 1) {
        await(bu.send('195716879237644292', `\`\`\`diff
!== { Suggestion Received } ==!
+ Author: ${msg.author.username} (${msg.author.id})${msg.channel.guild
                ? `\n+ Guild: ${msg.channel.guild.name} (${msg.channel.guild.id})
+ Channel: ${msg.channel.name} (${msg.channel.id})` : ''}
- Message: ${words.slice(1).join(' ').replace(/`/g, '`\u200b').replace(/\n/g, '\n- ')}
\`\`\``));
        await(bu.send(msg.channel.id, 'Suggestion sent! :ok_hand:'));
        t.post('1/cards', {
            name: words.slice(1).join(' '),
            desc: `Automated suggestion added by blargbot.\n\nAuthor: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
            due: null,
            idList: '57ef25d2ba874bf651e96fc1',
            idLabels: '58025f0184e677fd36dbd756'
        }, (err) => {
            if (err) throw err;
        });
    }
});