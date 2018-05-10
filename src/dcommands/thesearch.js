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

    async execute(msg, words) {
        var text = 'I use betterdiscord';
        if (words[1]) text = words.slice(1).join(' ');
        text = await bu.filterMentions(text);
        bot.sendChannelTyping(msg.channel.id);
        let buffer = await bu.blargbotApi('thesearch', {
            text: text
        });
        bu.send(msg, undefined, {
            file: buffer,
            name: 'TheSearch.png'
        });
    }
}

module.exports = ThesearchCommand;
