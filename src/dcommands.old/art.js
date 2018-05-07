var e = module.exports = {};





e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'art [user]';
e.info = `Shows everyone a work of art.`;
e.longinfo = `<p>Shows everyone a work of art.</p>`;

e.flags = [{
    flag: 'I',
    word: 'image',
    desc: 'A custom image.'
}];

e.execute = async function (msg, words) {
    let input = bu.parseInput(e.flags, words);
    let user = msg.author;
    let url;
    if (msg.attachments.length > 0) {
        url = msg.attachments[0].url;
    } else if (input.I) {
        url = input.I.join(' ');
    } else if (input.undefined.length > 0) {
        user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        url = user.avatarURL;
    }
    if (!url) url = msg.author.avatarURL;
    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();

    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'art',
        code: code,
        avatar: url
    });

    bu.send(msg, undefined, {
        file: buffer,
        name: 'sobeautifulstan.png'
    });
};