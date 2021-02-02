const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class MevalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'meval',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            let code = text.substring(words[0].length).trim();
            let res = await bot.sender.awaitMessage({
                message: 'meval',
                code: code
            });
            await bu.send(msg, 'Master eval input:\n```js\n' + code + '\n```\nOutput:```js\n' + res.result + '\n```');
        }
    }
}

module.exports = MevalCommand;
