var e = module.exports = {};

const reload = dep.reload;

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'clippy <text>';
e.info = `Clippy the paperclip is here to save the day!`;
e.longinfo = `<p>Clippy the paperclip is here to save the day!</p>`;
e.alias = ['clippit', 'paperclip'];

e.execute = async function (msg, words) {
    let text = await bu.filterMentions(words.slice(1).join(' '));
    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'clippy',
        code: code,
        text
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'DOYOUNEEDHELP.png'
    });
};