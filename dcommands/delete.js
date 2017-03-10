var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'delete [text]';
e.info = `Shows that you're about to delete something.`;
e.longinfo = `<p>Shows that you're about to delete something.</p>`;

e.execute = async function(msg, words) {
    if (words.length > 1) {
        let input = bu.filterMentions(words.slice(1).join('\n').replace(/\n/gim, ' ').substring(0, 256));
        let code = bu.genEventCode();
        bot.sendChannelTyping(msg.channel.id);

        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'delete',
            code: code,
            input: input
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'deleted.png'
        });
    } else {
        await bu.send(msg, 'Not enough input!');
    }

};