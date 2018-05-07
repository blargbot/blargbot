const BaseCommand = require('../structures/BaseCommand');

class ThesearchCommand extends BaseCommand {
    constructor() {
        super({
            name: 'thesearch',
            category: bu.CommandType.IMAGE,
            usage: 'thesearch [text]',
            info: 'Tells everyone about the progress of the search for intelligent life.'
        });
    }

    async execute(msg, words, text) {
        var shitText = 'I use betterdiscord';
        if (words[1]) shitText = words.slice(1).join(' ');
        shitText = await bu.filterMentions(shitText);
        console.debug(dep.util.inspect(words));
        bot.sendChannelTyping(msg.channel.id);
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'thesearch',
            code: code,
            text: shitText
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'TheSearch.png'
        });
    }
}

module.exports = ThesearchCommand;
