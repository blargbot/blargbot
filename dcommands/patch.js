var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'patch <features> [ | <fixes> ]';
e.info = 'Makes a patch note';
var changeChannel = '222199986123833344';
var roleId = '239399475263700992';
e.execute = async function(msg, words) {
        if (msg.author.id != bu.CAT_ID) {
            return;
        }
        words.shift();
        var message = words.join(' ');
        var args = message.split('|');
        let channel = await bot.getChannel(changeChannel);
        let role = channel.guild.roles.get(roleId);
        message = `${role.mention}\n**Version ${bu.VERSION}**
    
${args[0] ?
            `**New Features:**
${args[0]}
` : ''}
${args[1] ?
            `**Bug Fixes:**
${args[1]}
` : ''}`;
    await role.edit({
        mentionable: true
    });
    await bu.send(changeChannel, message);
    await role.edit({
        mentionable: false
    });
};