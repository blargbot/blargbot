var e = module.exports = {};

var exec = require('child_process').exec;

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'Yo shit waddup we\'re updating';
e.info = 'Does a git pull';

e.execute = (msg, words) => {
    if (msg.author.id === bu.CAT_ID) {

        if (!config.general.isbeta) {
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
                    var oldVersion = config.version;
                    var bits = oldVersion.split('.');
                    bits[type] = parseInt(bits[type]) + 1;
                    while (type < 2) {
                        type++;
                        bits[type] = 0;
                    }
                    config.version = bits.join('.');
                    bu.VERSION = config.version;
                    message += `\nNow running on version \`${config.version}\`!`;
                    bu.saveConfig();
                }
                bu.send(msg, message);

            });
        } else {
            bu.send(msg, `Whoa, you can't do that! This is the beta build!`);
        }
    }
};