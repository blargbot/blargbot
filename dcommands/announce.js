var e = module.exports = {};

const moment = require('moment');

e.init = () => {
    
    

    e.category = bu.CommandType.CAT;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'announce <stuff>';
e.info = 'Makes an annoucement';
var changeChannel = '229135592720433152';
var roleId = '239396821645000704';
e.execute = async function (msg, words) {
    if (msg.author.id != bu.CAT_ID) {
        return;
    }
    words.shift();
    var message = words.join(' ');
    let channel = await bot.getChannel(changeChannel);
    let role = channel.guild.roles.get(roleId);
    message = `**:information_source: Announcement [${moment().format('MM/DD/YYYY')}] ${role.mention} :information_source:**
**${msg.author.username}#${msg.author.discriminator}** has made the following announcement:

${message}`;
    await role.edit({
        mentionable: true
    });
    await bu.send(changeChannel, message);
    await role.edit({
        mentionable: false
    });
};