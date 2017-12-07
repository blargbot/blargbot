var e = module.exports = {};

const reload = dep.reload;

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'clyde <text>';
e.info = `Give everyone a message from Clyde.`;
e.longinfo = `<p>Give everyone a message from Clyde.</p>`;

e.execute = async function (msg, words) {
    if (words.length == 1) {
        bu.send(msg, 'Not enough arguments!'); return;
    }
    let text = await bu.filterMentions(words.slice(1).join(' '));
    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'clyde',
        code: code,
        text
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'clyde.png'
    });
};