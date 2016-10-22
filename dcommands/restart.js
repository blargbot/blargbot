var e = module.exports = {};
var bu;
var exec = require('child_process').exec;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.CAT;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function (msg) {
    if (msg.author.id === bu.CAT_ID) {
        await bu.r.table('vars').get('restart').replace({
          varname: 'restart',
          varvalue: msg.channel.id  
        }).run();
        await bu.send(msg.channel.id, 'Ah! You\'ve killed me! D:');
        exec('pm2 restart 0');
    }
};