var e = module.exports = {};

const reload = dep.reload;

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'truth <text>';
e.info = `Shows everyone what is written in the Scroll of Truth.`;
e.longinfo = `<p>Shows everyone what is written in the Scroll of Truth.</p>`;
e.alias = ['scrolloftruth'];

e.execute = async function (msg, words) {
    let text = await bu.filterMentions(words.slice(1).join(' '));
    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'truth',
        code: code,
        text
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'ScrollOfTruth.png'
    });
};