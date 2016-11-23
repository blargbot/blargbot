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
    if (words[1] && words[1].toLowerCase() == 'chis') {
        let chisMsgs = await r.table('chatlogs').getAll('100463282099326976', {
            index: 'userid'
        }).orderBy('msgid');
        let content = [];
        for (let message of chisMsgs) {
            content.push(message.content);
        }
        fs.writeFile(path.join(__dirname, '..', '..', 'catbot', 'chis.json'),
            JSON.stringify(content, null, 2), (err) => {
                if (err) bu.send(msg, err);
                bu.send(msg, 'Done!');
            });
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