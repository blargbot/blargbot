var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'dmerrors';
e.info = 'Toggles whether to DM you errors.';
e.longinfo = `<p>Toggles whether to DM you errors.</p>`;


e.execute = async function(msg) {
    let storedUser = await r.table('user').get(msg.author.id);

    await r.table('user').get(msg.author.id).update({
        dontdmerrors: storedUser.dontdmerrors ? false : true
    })
    if (storedUser.dontdmerrors) {
        bu.send(msg, 'I will now DM you if I have an issue running a command.');
    } else {
        bu.send(msg, 'I won\'t DM you if I have an issue running a command.');
    }
};