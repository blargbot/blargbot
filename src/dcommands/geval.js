const BaseCommand = require('../structures/BaseCommand');

class GevalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'geval',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            let code = text.substring(words[0].length).trim();
            let res = await bot.sender.awaitMessage({
                message: 'geval',
                code: code
            });
            console.log(code, res);
            res.result.sort((a, b) => a.shard > b.shard);
            res.result = res.result.map(shard => `====[ ${shard.shard} ]====\n\n${shard.result}`);
            await bu.send(msg, 'Global eval result of input:\n```js\n' + code + '\n```', { name: 'eval.txt', file: res.result.join('\n\n') });
        }
    }
}

module.exports = GevalCommand;
