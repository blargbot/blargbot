var e = module.exports = {};

const reload = dep.reload;

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'shit <text> [flags]';
e.info = `Tells everyone what's shit.`;
e.longinfo = `<p>Tells everyone what's shit. Use <code>-p</code> as the first argument to specify the text as plural.</p>`;

e.flags = [{
    flag: 'p',
    word: 'plural',
    desc: 'Whether or not the text is plural (use ARE instead of IS).'
}];

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    let shitText = 'Your favourite anime';
    var plural = false;
    if (input.p) plural = true;
    if (input.undefined.length > 0)
        shitText = await bu.filterMentions(input.undefined.join(' '));
    bot.sendChannelTyping(msg.channel.id);
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'shit',
        code: code,
        text: shitText,
        plural: plural
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'SHIIIITTTTTT.png'
    });
};