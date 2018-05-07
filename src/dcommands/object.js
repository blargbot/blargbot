const BaseCommand = require('../structures/BaseCommand');

class ObjectCommand extends BaseCommand {
    constructor() {
        super({
            name: 'object',
            category: bu.CommandType.IMAGE,
            usage: 'object &lt;text&gt;',
            info: 'OBJECTION!'
        });
    }

    async execute(msg, words, text) {

    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'objection',
        code: code,
        message: words.slice(1).join(' ')
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'OBJECTION.gif'
    });
    }
}

module.exports = ObjectCommand;
