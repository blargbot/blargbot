const Context = require('../Structures/Context');
const Resolve = require('./Resolve');

async function decodeAndSend(dest, key, args, file) {
    let output = await decode(dest, key, args);
    return await send(dest, output, file);
}

async function decode(dest, key, args = {}) {
    let { user, guild } = Resolve.generic(dest);
    let localeName;
    if (guild) {
        // TODO: get guild locale
    }
    if (user) {
        // TODO: get author locale
    }
    if (!localeName) {
        localeName = 'en_US';
    }
    let template = _discord.LocaleManager.getTemplate(localeName, key);
    if (template === null) {
        return await decode(dest, 'error.keyundef', { key });
    }

    let recursiveRegex = /\[\[(.+?)\]\]/, match;
    while ((match = recursiveRegex.exec(template)) != null) {
        template = template.replace(new RegExp('\\[\\[' + match[1] + '\\]\\]', 'g'), await decode(dest, match[1], args));
    };

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
    let { channel, user, guild } = Resolve.generic(dest);
    let destination = await Resolve.destination(dest);

    if (channel == undefined && guild == undefined) throw new Error('No such channel or guild');
    else if (channel == undefined && guild != undefined) channel = _discord.getChannel(guild.id);
    if (channel == undefined) throw new Error('No such channel');
    if (typeof content == 'string') {
        content = {
            content
        };
    }
    if (content.content == undefined) content.content = '';
    try {
        if (content.content.length > 2000) {
            return await destination.createMessage(await decode(dest, 'error.messagetoolong'), {
                file: (content.content || '') + '\n\n' + JSON.stringify(content.embed || {}, null, 2),
                name: 'output.json'
            });
        } else if (content.content.length >= 0) {
            return await destination.createMessage(content, file);
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
        if (user) {
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

function awaitMessage(ctx, callback, timeout) {
    return new Promise((resolve, reject) => {
        if (_discord.awaitedMessages[ctx.channel.id] == undefined)
            _discord.awaitedMessages[ctx.channel.id] = {};

        callback = callback || function (msg2) {
            return msg2.author.id == ctx.author.id;
        };

        timeout = timeout || 300000;
        let timer;
        if (timeout > 0)
            timer = setTimeout(function () {
                delete _discord.awaitedMessages[ctx.channel.id][ctx.author.id];
                reject(new Error('Await timed out after ' + timeout + 'ms'));
            }, timeout);

        if (_discord.awaitedMessages[ctx.channel.id][ctx.author.id] != undefined) {
            _discord.awaitedMessages[ctx.channel.id][ctx.author.id].kill();
        }

        _discord.awaitedMessages[ctx.channel.id][ctx.author.id] = {
            callback,
            execute: function (msg2) {
                if (timer != undefined) clearTimeout(timer);
                resolve(msg2);
            },
            kill: function () {
                if (timer != undefined) clearTimeout(timer);
                reject(new Error('Got overwritten by same channel-author pair'));
            }
        };
    });

}

module.exports = {
    send, decode, awaitMessage
};