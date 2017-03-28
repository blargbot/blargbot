const Context = require('../Structures/Context');

async function user(query, dest, quiet) {
    const { guild, channel, user } = generic(dest);
    let userList = guild.members, userId, userDiscrim;
    if (/\d{17,23}/.test(query)) {
        userId = query.match(/(\d{17,23})/)[0];
        return _discord.users.get(userId);
    }
    if (/^.*#\d{4}$/.test(query)) {
        userDiscrim = query.match(/^.*#(\d{4}$)/)[1];
        query = query.substring(0, query.length - 5);
    }
    if (userDiscrim) {
        userList = userList.filter(u => u.user.discriminator == userDiscrim);
    }
    userList = userList.filter(u => {
        let nameSearch = u.user.username
            && u.user.username.toLowerCase().includes(query.toLowerCase());
        let nickSearch = u.nick
            && u.nick.toLowerCase().includes(query.toLowerCase());
        return nameSearch || nickSearch;
    });
    userList.sort((a, b) => {
        let position = 0;
        position += compareNames(a.user.username, query, true, true, -1000);
        position += compareNames(a.nick, query, true, true, -1000);
        position += compareNames(b.user.username, query, true, true, 1000);
        position += compareNames(b.nick, query, true, true, 1000);

        position += compareNames(a.user.username, query, true, false, -100);
        position += compareNames(a.nick, query, true, false, -100);
        position += compareNames(b.user.username, query, true, false, 100);
        position += compareNames(b.nick, query, true, false, 100);

        position += compareNames(a.user.username, query, false, true, -10);
        position += compareNames(a.nick, query, false, true, -10);
        position += compareNames(b.user.username, query, false, true, 10);
        position += compareNames(b.nick, query, false, true, 10);

        position += compareNames(a.user.username, query, false, false, -1);
        position += compareNames(a.nick, query, false, false, -1);
        position += compareNames(b.user.username, query, false, false, 1);
        position += compareNames(b.nick, query, false, false, 1);

        return position;
    });

    if (userList.length == 1) {
        return userList[0].user;
    } else if (userList.length == 0) {
        if (!quiet)
            await _discord.Helpers.Message.decodeAndSend(dest, 'generic.resolveuser.nousers');
        return null;
    } else {
        let pickUserOne = await _discord.Helpers.Message.decode(dest, 'generic.resolveuser.pickuserone', {
            length: userList.length
        });
        let pickUserTwo = await _discord.Helpers.Message.decode(dest, 'generic.resolveuser.pickusertwo', {
            length: 5,
            name: user.fullName
        });
        let userListString = '';
        for (let i = 0; i < userList.length && i < 20; i++) {
            userListString += `${i + 1 < 10 ? ' ' + (i + 1) : i + 1}. ${userList[i].user.username}#${userList[i].user.discriminator}\n`;
        }
        let message = `${pickUserOne}\`\`\`prolog
${userListString}
\`\`\`
${pickUserTwo}`;
        await _discord.Helpers.Message.send(dest, message);
        let msg = await _discord.Helpers.Message.awaitMessage(dest, function (msg) {
            let index = parseInt(msg.content);
            return (msg.content.toLowerCase() == 'c' ||
                (!isNaN(index) && index <= 20 && index > 0 && index < userList.length));
        });
        if (msg.content.toLowerCase() == 'c') return null;
        let index = parseInt(msg.content);
        return userList[index - 1].user;
    }
}

function compareNames(nameOne, nameTwo, caseSensitive, startsWith, multiplicity = 1) {
    let index = false;
    if (nameOne && nameTwo) {
        if (startsWith) {
            if (caseSensitive) {
                index = nameOne.startsWith(nameTwo);
            } else {
                index = nameOne.toLowerCase().startsWith(nameTwo.toLowerCase());
            }
        } else {
            if (caseSensitive) {
                index = nameOne.includes(nameTwo);
            } else {
                index = nameOne.toLowerCase().includes(nameTwo.toLowerCase());
            }
        }
    }
    return index ? multiplicity : 0;
}

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
    generic, destination, user
};