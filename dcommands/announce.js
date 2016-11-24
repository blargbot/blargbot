var e = module.exports = {};

const moment = require('moment');

e.init = () => {



    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'announce <<text> | -reset>';
e.info = 'Makes an annoucement to a configured role, or resets the announcement configuration.';
e.longinfo = '<p>Makes an annoucement to a configured role, or resets the announcement configuration.</p>';

e.execute = async function(msg, words) {
    var changeChannel, roleId;
    let storedGuild = await bu.getGuild(msg.guild.id);
    if (words.length > 1) {
        if (words[1].toLowerCase() == '-reset') {
            delete storedGuild.announce;
            await r.table('guild').get(msg.channel.guild.id).replace(storedGuild).run();

            bu.send(msg, 'Announcement configuration reset! Do `b!announce` to reconfigure it.');
            return;
        }
        if (storedGuild.hasOwnProperty('announce')) {
            changeChannel = storedGuild.announce.channel;
            roleId = storedGuild.announce.role;
        } else {

            let msg2 = await bu.awaitMessage(msg,
                'This guild doesn\'t have announcements set up. Please mention the channel that announcements should be put in.',
                m => {
                    if (m.channelMentions.length > 0) return true;
                    else return false;
                });
            changeChannel = msg2.channelMentions[0];
            msg2 = await bu.awaitMessage(msg,
                'Please type the name or ID of the role to announce to.');
            let role = await bu.getRole(msg, msg2.content);
            if (role != null) {
                if (role.name == '@everyone')
                    roleId = 'everyone'
                else roleId = role.id;
            } else {
                bu.send(msg, `I couldn't find a role with that name. Run \`b!announce\` to attempt the setup again.`);
                return;
            }
            await r.table('guild').get(msg.channel.guild.id).update({
                announce: {
                    channel: changeChannel,
                    role: roleId
                }
            }).run();
        }
        if (msg.channel.guild.channels.get(changeChannel) == undefined || msg.channel.guild.roles.get(roleId) == undefined) {
            bu.send(msg, `The assigned channel or role has been deleted, the config will be cleaned. Please run the command again.`);
            delete storedGuild.announce;
            await r.table('guild').get(msg.channel.guild.id).update({
                announce: r.literal({})
            }).run();
            return;
        }
        words.shift();
        var message = words.join(' ');
        let channel = bot.getChannel(changeChannel);
        let role = channel.guild.roles.get(roleId);
        let embed = {
            footer: {
                text: bu.getFullName(msg.author),
                icon_url: msg.author.avatarURL
            },
            color: getTopRole(msg.member).color,
            description: message + '\n',
            timestamp: moment(msg.timestamp),
            author: {
                name: 'Announcement',
                icon_url: 'http://i.imgur.com/zcGyun6.png'
            }
        };
        message = `**:information_source: Announcement [${moment().format('MM/DD/YYYY')}] ${role.mention} :information_source:**
**${msg.author.username}#${msg.author.discriminator}** has made the following announcement:

${message}`;
        logger.debug(message);
        try {
            await role.edit({
                mentionable: true
            });
        } catch (err) {
            logger.error(err);
        }
        await bu.send(changeChannel, {
            content: role.mention,
            embed: embed
        });
        try {
            await role.edit({
                mentionable: false
            });
        } catch (err) {
            logger.error(err);
        }
    } else {
        bu.send(msg, 'You have to tell me what to announce!');
    }
};


function getTopRole(member) {;
    let role = member.guild.roles.get(member.roles.sort((a, b) => {
        let thing = 0;
        if (member.guild.roles.get(a).color > 0) thing -= 9999999;
        if (member.guild.roles.get(b).color > 0) thing += 9999999;
        thing += member.guild.roles.get(b).position - member.guild.roles.get(a).position;
        return thing;
    })[0]);
    return role;
};