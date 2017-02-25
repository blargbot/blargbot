var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'avatar [id/name/mention]';
e.info = 'Gets a user\'s avatar';
e.longinfo = `<p>Gets a user\'s avatar</p>`;
e.flags = [{
    flag: 'f',
    word: 'format',
    desc: `The file format. Can be 'jpg', 'png', 'webp', or 'gif'. Defaults to 'png', or 'gif' if it's an animated avatar.`
}, {
    flag: 's',
    word: 'size',
    desc: 'The file size. Can be 128, 256, 512, 1024, or 2048. Defaults to 512.'
}];

e.execute = async function(msg, words) {
    var user;
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        user = msg.author;
    } else {
        user = await bu.getUser(msg, input.undefined.join(' '));
    }
    if (!user) {
        return;
    }
    let format = 'png',
        size = 512;
    if (input.f && input.f.length > 0) format = input.f.join(' ');
    if (input.s && input.s.length > 0) size = parseInt(input.s.join(' '));
    logger.debug(format, size);
    await msg.channel.sendTyping();
    bu.sendFile(msg.channel.id, `**${bu.getFullName(user)}**'s avatar`, user.dynamicAvatarURL(format, size));
};