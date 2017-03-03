async function send(input, content, file) {
    let channelId;
    let senderId;
    if (input instanceof _dep.Eris.Message) {
        channelId = input.channel.id;
        senderId = input.author.id;
    } else if (input instanceof _dep.Eris.Channel) {
        channelId = input.id;
    } else if (input instanceof _dep.Eris.User) {
        channelId = (await input.getDMCHannel()).id;
    }
    const channel = bot.getChannel(channelId);
    if (channel == undefined) throw new Error('No such channel');
    if (content instanceof String) {
        content = {
            content
        };
    }
    try {
        if (content.content.length > 2000) {
            return await channel.createMessage(_constants.Message.Generic.MessageTooLong(), {
                file: JSON.stringify(content, null, 2),
                name: 'output.json'
            });
        } else if (content.content.length > 0) {
            return await channel.createMessage(content, file);
        }
    } catch (err) {
        let response;
        if (err.response) {
            try {
                response = JSON.parse(err.response);
            } catch (err) {}
        }
        let Embed = {
            title: response !== undefined ? `${err.name}: ${response.code} - ${response.message}` : err.name,
            description: err.stack.substring(0, 250),
            fields: [],
            color: 0xAD1111,
            timestamp: _dep.moment()
        };
        if (channel.guild) {
            Embed.fields.push({
                name: 'Guild',
                value: `${channel.guild.name}\n${channel.guild.id}`
            });
        }
        Embed.fields.push({
            name: 'Channel',
            value: `${channel.name}\n${channel.id}`
        });
        if (senderId) {
            let user = bot.users.get(senderId);
            if (user != undefined)
                Embed.author = {
                    name: user.fullNameId,
                    icon_url: user.avatarURL
                };
        }
        await bot.createMessage(_constants.ERROR_CHANNEL, {
            embed: Embed
        }, {
            file: JSON.stringify(content, null, 2),
            name: 'error-output.json'
        });
        throw err;
    }
}

module.exports = {
    send
};