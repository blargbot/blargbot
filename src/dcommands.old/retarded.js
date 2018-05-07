var e = module.exports = {};

const reload = dep.reload;

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'retarded <text> [flags]';
e.info = `Tells everyone who is retarded.`;
e.longinfo = `<p>Tells everyone who is retarded</p>`;

e.flags = [{
    flag: 'u',
    word: 'user',
    desc: 'The person who is retarded.'
}, {
    flag: 'I',
    word: 'image',
    desc: 'A custom image.'
}];

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        bu.send(msg, 'Not enough input!');
        return;
    }
    let user, url;
    if (msg.attachments.length > 0) {
        url = msg.attachments[0].url;
    } else if (input.I) {
        url = input.I.join(' ');
    } else if (input.u) {
        user = await bu.getUser(msg, input.u.join(' '));
        if (user) url = user.avatarURL;
    } else {
        url = msg.author.avatarURL;
    }

    let quote = await bu.filterMentions(input.undefined.join(' '));

    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'retarded',
        code: code,
        text: quote,
        avatar: url
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'retarded.png'
    });
};