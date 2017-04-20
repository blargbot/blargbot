var e = module.exports = {};



e.init = () => {
    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function (msg) {
    if (msg.author.id === bu.CAT_ID) {
        logger.verbose('We should be going for a restart now.');
        await r.table('vars').get('restart').replace({
            varname: 'restart',
            varvalue: {
                channel: msg.channel.id,
                time: r.now()
            }
        }).run();
        logger.verbose('The restart variable has been inserted into the database.');
        await bu.send(msg, 'Ah! You\'ve killed me! D:');
        logger.verbose('We have sent the message. Calling `process.exit()` now.');
        process.exit(0);
    }
};