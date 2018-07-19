const moment = require('moment-timezone');

class BaseCommand {
    constructor(params = {}) {
        this.name = params.name || '';
        this.category = params.category || bu.CommandType.GENERAL;
        this.hidden = params.hidden || false;
        this.usage = params.usage || '';
        this.info = params.info || '';
        this.aliases = params.aliases || [];
        this.onlyOn = params.onlyOn || undefined;
        this.flags = params.flags || undefined;
        this.cannotDisable = params.cannotDisable || false;
    }

    get isCommand() {
        return true;
    }

    get longinfo() {
        return this.info;
    }

    execute(msg, words, text) {

    }

    static stringify(embed) {
        let result = '';
        if (typeof embed !== 'object')
            return result;
        if (embed.title)
            result += `**${embed.title.replace(/\*/, '\\*')}**\n`;
        if (embed.description)
            result += `${embed.description}\n`;
        if (embed.fields)
            for (const field of embed.fields)
                result += `\n**${field.name.replace(/\*/, '')}**\n${field.value}`;
        if (embed.footer)
            result += `*${embed.footer.text.replace(/\*/, '')}*`;
        if (embed.footer && embed.timestamp)
            result += ' | ';
        if (embed.timestamp)
            result += `${moment(embed.timestamp).format('ddd Do MMM, YYYY [at] h:mm A')}`;
        return result;
    }
}

module.exports = BaseCommand;
