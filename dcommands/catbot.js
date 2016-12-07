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
    await bot.sendChannelTyping(msg.channel.id);
    if (words[1]) {
        switch (words[1].toLowerCase()) {
            case 'chis':
                genlogs(msg, '100463282099326976', 'chis');
                break;
            case 'mindy':
                genlogs(msg, '217122202934444033', 'mindy');
                break;
            case 'zeta':
                genlogs(msg, '94129005791281152', 'zeta');
                break;
            case 'fuyu':
                genlogs(msg, ['141545699442425856', '214796473689178133'], 'fuyu');
                break;
            case 'triping':
                genlogs(msg, '128694295170514944', 'triping');
                break;
            case 'hk':
                genlogs(msg, '104360151208706048', 'hk');
                break;
            case 'tttie':
                genlogs(msg, '150628341316059136', 'tttie');
                break;
            case 'blarg':
                genlogs(msg, '134133271750639616', 'blarg');
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
};

async function genlogs(msg, id, name) {
    let msgs;
    if (Array.isArray(id)) {
        id.push({
            index: 'userid'
        });
        msgs = await r.db('blargdb').table('chatlogs').getAll(id[0], id[1], id[2]).orderBy('msgid');
    } else
        msgs = await r.db('blargdb').table('chatlogs').getAll(id, {
            index: 'userid'
        }).orderBy('msgid');
    let content = [];
    for (let message of msgs) {
        content.push(message.content);
    }
    let userId;
    if (Array.isArray(id)) userId = id[0];
    else userId = id;
    fs.writeFile(path.join(__dirname, '..', '..', 'catbot', 'jsons', userId + '.json'),
        JSON.stringify({
            name: name,
            lines: content
        }, null, 2), (err) => {
            if (err) bu.send(msg, err);
            bu.send(msg, 'Done!');
        });
}