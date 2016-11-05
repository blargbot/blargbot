var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = true;
e.usage = '';
e.info = '';

e.execute = (msg) => {
    if (msg.channel.id === config.discord.channel) {
        reloadUserList();
        bu.send(msg, 'Reloaded the user list! Check the channel topic.');
    }
};