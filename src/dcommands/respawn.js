var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = true;
e.usage = 'respawn <id> | all';
e.info = 'Shard respawning only for staff.';

e.execute = async (msg, words) => {
    let police = (await r.table('vars').get('police')).value;
    if (police.includes(msg.author.id)) {
        console.log('aaa');
        let id = parseInt(words[1]);
        if (isNaN(id))
            return await bu.send(msg, 'that wasn\'t even a number pls');

        bot.sender.send('respawn', { id, channel: msg.channel.id });
        await bu.send(msg, 'ok shard ' + id + ' is being respawned and stuff now');
    }
};