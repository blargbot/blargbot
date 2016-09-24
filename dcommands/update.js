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
e.usage = 'Yo shit waddup we\'re updating';
e.info = 'Does a git pull';

e.execute = (msg, words) => {
    if (msg.author.id === bu.CAT_ID) {

        if (!bu.config.general.isbeta) {
            exec('cd /home/cat/blargjs\ngit pull origin master', (err, stdout, stderr) => {
                var message = '```xl\n';
                if (err) {
                    message += err + '\n';
                }
                if (stderr) {
                    message += stderr + '\n';
                }
                if (stdout) {
                    message += stdout + '\n';
                }

                message += '```';
                if (stdout.indexOf('Already up-to-date.') == -1) {
                    var type = 2;
                    if (words.length > 1) {
                        switch (words[1].toLowerCase()) {
                            case 'major':
                                type = 1;
                                break;
                            case 'overhaul':
                                type = 0;
                                break;
                        }
                    }
                    var oldVersion = bu.config.version;
                    var bits = oldVersion.split('.');
                    bits[type] = parseInt(bits[type]) + 1;
                    while (type > 0) {
                        type--;
                        bits[type] = 0;
                    }
                    bu.config.version = bits.join('.');
                    bu.VERSION = bu.config.version;
                    message += `\nNow running on version \`${bu.config.version}\`!`;
                    bu.saveConfig();
                }
                bu.sendMessageToDiscord(msg.channel.id, message);

            });
        } else {
            bu.sendMessageToDiscord(msg.channel.id, `Whoa, you can't do that! This is the beta build!`);
        }
    }
};