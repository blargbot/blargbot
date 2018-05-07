const BaseCommand = require('../structures/BaseCommand');

class UpdateCommand extends BaseCommand {
    constructor() {
        super({
            name: 'update',
            category: bu.CommandType.CAT,
            usage: 'Yo shit waddup we\'re updating',
            info: 'Does a git pull'
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {

            if (!config.general.isbeta) {
                dep.exec('git pull', async (err, stdout, stderr) => {
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
                        var version = await bu.getVersion();
                        switch (type) {
                            case 0: version.incrementMajor(); break;
                            case 1: version.incrementMinor(); break;
                            case 2: version.incrementPatch(); break;
                        }
                        await version.save();

                        message += `\nNow running on version \`${version}\`!`;
                    }
                    bu.send(msg, message);
                });
            } else {
                bu.send(msg, `Whoa, you can't do that! This is the beta build!`);
            }
        }
    }
}

module.exports = UpdateCommand;
