var e = module.exports = {};

var exec = require('child_process').exec;

e.init = () => {
    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function(msg) {
    if (msg.author.id === bu.CAT_ID) {
        await r.table('vars').get('restart').replace({
            varname: 'restart',
            varvalue: {
                channel: msg.channel.id,
                time: r.now()
            }
        }).run();
        await bu.send(msg, 'Ah! You\'ve killed me! D:');
        process.exit();
    }
};