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
    if (msg.channel.id === bu.config.discord.channel) {
        bu.reloadUserList();
        bu.sendMessageToDiscord(msg.channel.id, 'Reloaded the user list! Check the channel topic.');
    }
};