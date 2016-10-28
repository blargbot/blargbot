var e = module.exports = {};

const Trello = require('node-trello');
var t;
const moment = require('moment');



e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;
    t = new Trello(config.general.trellokey, config.general.trellotoken);

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'suggest <suggestion>';
e.info = 'Sends me a suggestion. Thanks for the feedback!';
e.longinfo = `<p>Sends a suggestion to my guild. Thank you for the feedback! It's very important to me.</p>`;

e.execute = async function(msg, words) {
    if (words.length > 1) {
        let i = 0;
        let lastSuggestion = await bu.r.table('suggestion').orderBy({ index: bu.r.desc('id') }).limit(1).run();
        if (lastSuggestion.length > 0) i = lastSuggestion[0].id + 1;
        logger.debug(i, lastSuggestion);
        if (isNaN(i)) i = 0;

        await bu.send('195716879237644292', `
**__${i} | Suggestion__**
**Author**: ${msg.author.username} (${msg.author.id})${msg.channel.guild
                ? `\n**Guild**: ${msg.channel.guild.name} (${msg.channel.guild.id})
**Channel**: ${msg.channel.name} (${msg.channel.id})` : ''}
**Message**: ${msg.id}
${words.slice(1).join(' ')} 
`);
        t.post('1/cards', {
            name: words.slice(1).join(' '),
            desc: `Automated suggestion added by blargbot.\n\nAuthor: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
            due: null,
            idList: '57ef25d2ba874bf651e96fc1',
            idLabels: '58025f0184e677fd36dbd756'
        }, (err) => {
            if (err) throw err;
        });
        await bu.r.table('suggestion').insert({
            id: i,
            author: msg.author.id,
            channel: msg.channel.id,
            message: words.slice(1).join(' '),
            messageid: msg.id,
            date: bu.r.epochTime(moment().unix())
        }).run();
        await bu.send(msg.channel.id, 'Suggestion sent! :ok_hand:');
    }
};