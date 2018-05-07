const BaseCommand = require('../structures/BaseCommand');

class CatbotCommand extends BaseCommand {
    constructor() {
        super({
            name: 'catbot',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            await bot.sendChannelTyping(msg.channel.id);
            if (words[1]) {
                switch (words[1].toLowerCase()) {
                    case 'add':
                        if (msg.mentions.length > 0 && words[2]) {
                            let ids = msg.mentions.map(u => u.id);
                            if (ids.length == 1) {
                                ids = ids[0];
                            }
                            await r.db('blargdb').table('markovs').insert({
                                userid: ids,
                                id: words[2].toLowerCase()
                            });
                            bu.send(msg, 'Added.');
                        } else {
                            bu.send(msg, 'Nope.');
                        }
                        break;
                    case 'remove':
                        if (words[2]) {
                            await r.db('blargdb').table('markovs').get(words[2].toLowerCase()).delete();
                            bu.send(msg, 'Removed.');
                        } else {
                            bu.send(msg, 'Nope.');
                        }
                        break;
                    case 'list':
                        let things = await r.db('blargdb').table('markovs').withFields('id');
                        bu.send(msg, things.map(t => t.id).join('\n'));
                        break;
                    default:
                        let markov = await r.db('blargdb').table('markovs').get(words[1]);
                        if (markov) {
                            genlogs(msg, markov.userid, markov.id);
                        }
                        break;
                }

            } else {
                let catMsgs = await r.table('catchat').orderBy('msgid');
                let content = [];
                for (let message of catMsgs) {
                    if (message.guildid != '197529405659021322' && message.nsfw == 0)
                        content.push(message.content);
                }
                dep.fs.writeFile(dep.path.join(__dirname, '..', '..', 'catbot', 'cat.json'),
                    JSON.stringify(content, null, 2), (err) => {
                        if (err) bu.send(msg, err);
                        bu.send(msg, 'Done!');
                    });
            }
        }
    }
}

module.exports = CatbotCommand;
