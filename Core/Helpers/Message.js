const Context = require('../Structures/Context');

async function decodeAndSend(dest, key, args, file) {
    let output = await decode(dest, key, args);
    return await send(dest, output, file);
}

async function decode(dest, key, args = {}) {
    let author, guild;
    if (dest instanceof _dep.Eris.Message) {
        author = dest.author;
        guild = dest.guild;
    } else if (dest instanceof _dep.Eris.User) {
        author = dest;
    } else if (dest instanceof _dep.Eris.Channel) {
        guild = dest.guild;
    } else if (dest instanceof Context) {
        guild = dest.guild;
        author = dest.author;
    } else if (typeof dest == 'string') {
        guild = _discord.getChannel(dest).guild;
    }
    let localeName;
    if (guild) {
        // TODO: get guild locale
    } 
    if (author) {
        // TODO: get author locale
    }
    if (!localeName) {
        localeName = 'en_US';
    }
    let template = _discord.LocaleManager.getTemplate(localeName, key);
    if (Array.isArray(template)) {
        template = template[_discord.Core.Helpers.Random.getRandomInt(0, template.length - 1)];
    }
    
    for (const arg of Object.keys(args)) {
        let regexp = new RegExp('\{\{' + arg + '\}\}', 'g');
        template = template.replace(regexp, args[arg]);
    }
    
    return template;
}

async function send(dest, content = '', file) {
    let channel;
    let senderId;
    if (dest instanceof _dep.Eris.Message) {
        channel = dest.channel;
        senderId = dest.author.id;
    } else if (dest instanceof _dep.Eris.Channel) {
        channel = dest;
    } else if (dest instanceof _dep.Eris.User) {
        channel = await dest.getDMCHannel();
    } else if (typeof dest == 'string') {
        channel = _discord.getChannel(dest);
    } else if (dest instanceof Context) {
        channel = dest.msg.channel;
        senderId = dest.msg.author.id;
    }
    if (channel == undefined) throw new Error('No such channel');
    if (typeof content == 'string') {
        content = {
            content
        };
    }
    try {
        if (content.content.length > 2000) {
            return await channel.createMessage(await decode(dest, 'generic.messagetoolong'), {
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
            } catch (err) { }
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
        Embed.fields.push({
            name: 'Content',
            value: `${(content.content || '[]').substring(0, 100)}`
        });
        if (senderId) {
            let user = _discord.users.get(senderId);
            if (user != undefined)
                Embed.author = {
                    name: user.fullNameId,
                    icon_url: user.avatarURL
                };
        }
        await _discord.createMessage(_constants.ERROR_CHANNEL, {
            embed: Embed
        }, {
                file: JSON.stringify(content, null, 2),
                name: 'error-output.json'
            });
        throw err;
    }
}

module.exports = {
    send, decode
};