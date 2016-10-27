var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'version';
e.info = 'Tells you what version I am on';
e.longinfo = `<p>Tells you what version the bot is currently running on.</p>`;

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, `I am running blargbot version ${bu.VERSION}!`);

};