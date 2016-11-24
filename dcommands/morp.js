var e = module.exports = {};
const request = require('request');
const path = require('path');
const fs = require('fs');
e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = false;
e.hidden = false;
e.usage = '';
e.info = '';
e.execute = async function(msg, words) {
    await bot.sendChannelTyping(msg.channel.id);
    request({
        uri: 'https://bots.discord.pw/api/bots',
        headers: {
            'User-Agent': 'blargbot/1.0 (ratismal)',
            'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIxMDMzNDc4NDM5MzQyMTIwOTYiLCJyYW5kIjozNywiaWF0IjoxNDcwNDM0NTYzfQ.97KGPSzkDf_p7DFEngTJTijakTBTUYkIs_pT277fHdQ'
        }
    }, (err, res, body) => {
        let badBots = [];
        let bots = JSON.parse(body).map(m => m.user_id);
        for (let bot of msg.guild.members.filter(m => m.user.bot).map(m => m.user)) {
            if (!bots.includes(bot.id)) {
                badBots.push(bot);
            }
        }
        fs.writeFile(path.join(__dirname, 'badbots.json'),
            JSON.stringify(badBots.map(m => bu.getFullName(m) + ` (${m.id})`), null, 2), (err, filename) => {
                bu.send(msg, 'Done\n' + err + '\n' + filename);
            });
    })
};