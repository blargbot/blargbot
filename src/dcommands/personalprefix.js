var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'personalprefix add|remove [prefix]';
e.alias = ['pprefix'];
e.info = 'Adds or removes a personal prefix.';
e.longinfo = `<p>Adds or removes a personal prefix. Personal prefixes can be used on any guild, but only by you.</p>`;

e.execute = async (msg, words, text) => {
    let storedUser = await r.table('user').get(msg.author.id);
    if (!storedUser.prefixes) storedUser.prefixes = [];
    console.log(words);
    if (words.length > 2) {
        let prefixes = words.splice(2).map(p => p.toLowerCase());
        switch (words[1].toLowerCase()) {
            case 'add':
            case 'set':
            case 'create':
                for (const prefix of prefixes) {
                    if (!storedUser.prefixes.includes(prefix))
                        storedUser.prefixes.push(prefix);
                }
                await r.table('user').get(msg.author.id).update({
                    prefixes: r.literal(storedUser.prefixes)
                });
                await bu.send(msg, 'Your prefix(es) have been added.');
                break;
            case 'remove':
            case 'delete':
                storedUser.prefixes = storedUser.prefixes.filter(p => !prefixes.includes(p));
                await r.table('user').get(msg.author.id).update({
                    prefixes: r.literal(storedUser.prefixes)
                });
                await bu.send(msg, 'Your prefix(es) have been removed.');
                break;
        }
    } else {
        if (storedUser.prefixes.length === 0)
            await bu.send(msg, 'You have no personal prefixes.');
        else
            await bu.send(msg, `You have the following personal prefixes:\n${storedUser.prefixes.map(p => ' - ' + p).join('\n')}`);
    }
    //   }
};