const BaseCommand = require('../structures/BaseCommand');

class SevalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'seval',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            let code = text.substring(words[0].length).trim();
            let res = await bot.sender.awaitMessage({
                message: 'seval',
                code: code
            });
            console.log(code, res);
            await bu.send(msg, 'Sum result of all shards:\n```js\n' + res.result + '\n```');
        }
    }
}

module.exports = SevalCommand;
