const BaseCommand = require('../structures/BaseCommand');
const { exec } = require('child_process');
const newbutils = require('../newbu');

class UpdateCommand extends BaseCommand {
    constructor() {
        super({
            name: 'update',
            category: newbutils.commandTypes.CAT,
            usage: 'Yo shit waddup we\'re updating',
            info: 'Does a git pull'
        });
    }

    async execute(msg, words) {
        if (msg.author.id === config.discord.users.owner) {

            if (!config.general.isbeta) {
                exec('git pull', async (err, stdout, stderr) => {
                    let message = '```xl\n';
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
                        let type = 2;
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
                        let version = await bu.getVersion();
                        switch (type) {
                            case 0:
                                version.incrementMajor();
                                break;
                            case 1:
                                version.incrementMinor();
                                break;
                            case 2:
                                version.incrementPatch();
                                break;
                        }
                        await version.save();

                        message += `\nNow running on version \`${version}\`!`;
                    }
                    bu.send(msg, message);
                });
            } else {
                bu.send(msg, 'Whoa, you can\'t do that! This is the beta build!');
            }
        }
    }
}

module.exports = UpdateCommand;
