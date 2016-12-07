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
                case 'xeta':
                    genlogs(msg, '155490847494897664', 'xeta');
                    break;
                case 'axonium':
                    genlogs(msg, '133332642685779968', 'axonium');
                    break;
                case 'notso':
                    genlogs(msg, '130070621034905600', 'notso');
                    break;
                case 'mine':
                    genlogs(msg, '155112606661607425', 'mine');
                    break;
                case 'abal':
                    genlogs(msg, ['150061853001777154', '98295630480314368'], 'abal');
                    break;
                case 'pollr':
                    genlogs(msg, '168169809303961600', 'pollr');
                    break;
                case 'alex':
                    genlogs(msg, '86477779717066752', 'alex');
                    break;
                case 'randon':
                    genlogs(msg, '145162973910925312', 'randon');
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