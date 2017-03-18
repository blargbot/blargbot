var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'pardon <user> [flags]';
e.info = 'Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.';
e.longinfo = `<p>Pardons a user.</p>
    <p>If mod-logging is enabled, the pardon will be logged.</p>
    <p>This will not unban users.</p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the pardon.'
}, {
    flag: 'c',
    word: 'count',
    desc: 'The number of warnings that will be removed.'
}];

e.execute = async function (msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        bu.send(msg, 'Not enough input. Do `b!help warn` for usage instructions.');
        return;
    }
    let user = await bu.getUser(msg, input.undefined.join(' '));
    if (!user) return;
    let count = 1;
    if (input.c && input.c.length > 0) {
        let tempCount = parseInt(input.c[0]);
        if (!isNaN(tempCount)) count = tempCount;
    }
    let res = await bu.issuePardon(user, msg.guild, count);
    await bu.logAction(msg.guild, user, msg.author, 'Pardon', input.r, bu.ModLogColour.PARDON, [{
        name: 'Pardons',
        value: `Assigned: ${count}\nNew Total: ${res.count || 0}`,
        inline: true
    }]);
    bu.send(msg, `:ok_hand: **${bu.getFullName(user)}** has been given ${count == 1 ? 'a pardon' : count + ' pardons'}. They now have ${res} warnings.`);
};