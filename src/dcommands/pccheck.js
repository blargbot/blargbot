var e = module.exports = {};





e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'pccheck <text>';
e.info = `Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.`;
e.longinfo = `<p>Tells everyone a reason why they should get their PC checked.</p>`;



e.execute = async function (msg, words) {
    if (words.length === 1) {
        return bu.send(msg, 'You didn\'t provide any text!');
    }

    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();

    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'pccheck',
        code: code,
        text: words.slice(1).join(' ')
    });

    bu.send(msg, undefined, {
        file: buffer,
        name: 'didyouknow.png'
    });
};