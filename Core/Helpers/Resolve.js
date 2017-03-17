const Context = require('../Structures/Context');

function generic(dest) {
    let user, guild, channel, member;
    if (dest instanceof _dep.Eris.Message) {
        user = dest.author;
        guild = dest.guild;
        channel = dest.channel;
        member = dest.member;
    } else if (dest instanceof _dep.Eris.User) {
        user = dest;
    } else if (dest instanceof _dep.Eris.Member) {
        user = dest.user;
        member = dest;
        guild = dest.guild;
    } else if (dest instanceof _dep.Eris.Channel) {
        guild = dest.guild;
        channel = dest;
    } else if (dest instanceof _dep.Eris.Guild) {
        guild = dest;
    } else if (dest instanceof Context) {
        guild = dest.guild;
        user = dest.author;
        channel = dest.channel;
        member = dest.msg.member;
    } else if (typeof dest == 'string') {
        channel = _discord.getChannel(dest);
        guild = channel.guild;
    }
    return { user, channel, guild, member };
}

async function destination(dest) {
    let { user, guild, channel } = generic(dest);
    let channelToSend;
    if (channel != undefined) {
        channelToSend = channel;
    } else if (user != undefined) {
        channelToSend = await user.getDMChannel();
    } else if (guild != undefined) {
        channelToSend = _discord.getChannel(guild.id);
    }
    return channelToSend;
}

module.exports = {
    generic, destination
};