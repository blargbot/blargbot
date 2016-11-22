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
};