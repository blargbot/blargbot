var e = module.exports = {};





e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'sonicsays <text>';
e.info = `Sonic wants to share some words of wisdom.`;
e.longinfo = `<p>Sonic wants to share some words of wisdom.</p>`;



e.execute = async function (msg, words) {
    if (words.length === 1) {
        return bu.send(msg, 'You didn\'t provide any text!');
    }

    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();

    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'sonicsays',
        code: code,
        text: words.slice(1).join(' ')
    });

    bu.send(msg, undefined, {
        file: buffer,
        name: 'sonicsays.png'
    });
};