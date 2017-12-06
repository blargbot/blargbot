var e = module.exports = {};



e.init = () => {
    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function (msg, words) {
    if (msg.author.id === bu.CAT_ID) {
        if (words[1] === 'kill') {
            await bu.send(msg, 'Ah! You\'ve killed me! D:');
            await r.table('vars').get('restart').replace({
                varname: 'restart',
                varvalue: {
                    channel: msg.channel.id,
                    time: r.now()
                }
            }).run();
            bot.sender.send('KILLEVERYTHING', msg.channel.id);
        } else {
            await bu.send(msg, 'Ah! You\'ve killed me but in a way that minimizes downtime! D:');
            bot.sender.send('respawnAll', msg.channel.id);
        }
    }
};