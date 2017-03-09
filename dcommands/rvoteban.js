var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'rvoteban (<user> | <flags>)';
e.info = 'Removes the votebans for a specific user, or removes all votebans completely.';
e.longinfo = '<p>Removes the votebans for a specific user, or removes all votebans completely.</p>';
e.alias = ['rpollban', 'removevoteban', 'removepollban', 'rvb', 'rpb'];
e.flags = [
    { flag: 'a', word: 'all', desc: 'Removes all votebans' }
];

e.execute = async function (msg, words, text) {
    let storedGuild = await bu.getGuild(msg.guild.id);
    let votebans = storedGuild.votebans || {};
    let input = bu.parseInput(e.flags, words);
    if (input.a) {
        let msg2 = await bu.awaitMessage(msg, 'This will remove all the votebans on this guild. Type `yes` to confirm, or anything else to cancel.');
        if (msg2.content.toLowerCase() == 'yes' || msg2.content.toLowerCase() == 'y') {
            await r.table('guild').get(msg.guild.id).update({
                votebans: r.literal({})
            });
            await bu.send(msg, 'Removed all votebans!');
        } else {
            await bu.send(msg, 'Nothing was removed.');
        }
    } else if (input.undefined.length > 0) {
        let user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        delete votebans[user.id];
        await r.table('guild').get(msg.guild.id).update({
            votebans: r.literal(votebans)
        });
        await bu.send(msg, 'Removed all of the petitions against **' + bu.getFullName(user) + '**!');
    } else {
        await bu.send(msg, 'Not enough arguments! Do `b!help rvoteban` for more details.');
    }
};