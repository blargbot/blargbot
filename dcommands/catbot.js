var e = module.exports = {};

const fs = require('fs');
const path = require('path');

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function(msg, words) {
    if (msg.author.id == bu.CAT_ID) {
        await bot.sendChannelTyping(msg.channel.id);
        if (words[1]) {
            switch (words[1].toLowerCase()) {
                case 'add':
                    if (msg.mentions.length > 0 && words[2]) {
                        let ids = msg.mentions.map(u => u.id);
                        await r.db('blargdb').table('markovs').insert({
                            userid: ids.length == 1 ? ids[0] || ids,
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
            fs.writeFile(path.join(__dirname, '..', '..', 'catbot', 'cat.json'),
                JSON.stringify(content, null, 2), (err) => {
                    if (err) bu.send(msg, err);
                    bu.send(msg, 'Done!');
                });
        }
    }
};

async function genlogs(msg, id, name) {
    let msg2 = await bu.send(msg, 'Performing query...');
    let msgs;
    if (Array.isArray(id)) {
        id.push({
            index: 'userid'
        });
        msgs = await r.db('blargdb').table('chatlogs').getAll(id[0], id[1], id[2]);
    } else
        msgs = await r.db('blargdb').table('chatlogs').getAll(id, {
            index: 'userid'
        });
    await msg2.edit('Generating array...');
    let content = [];
    for (let message of msgs) {
        content.push(message.content);
    }
    let userId;
    if (Array.isArray(id)) userId = id[0];
    else userId = id;
    msg2.edit('Writing file...');
    fs.writeFile(path.join(__dirname, '..', '..', 'catbot', 'jsons', userId + '.json'),
        JSON.stringify({
            name: name,
            lines: content
        }, null, 2), (err) => {
            if (err) bu.send(msg, err);
            msg2.edit('Done.');
        });
}