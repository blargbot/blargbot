const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class GevalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'geval',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === config.discord.users.owner) {
            let code = text.substring(words[0].length).trim();
            let res = await bot.sender.awaitMessage({
                message: 'geval',
                code: code
            });
            console.log(code, res);
            res.result = res.result.filter(s => s.result !== undefined);
            res.result.sort((a, b) => a.shard > b.shard);
            res.result = res.result.map(shard => `====[ ${shard.shard} ]====\n\n${shard.result}`);
            let output = res.result.join('\n\n');
            let start = 'Global eval result of input:\n```js\n' + code + '\n```';
            if (output.length === 0) {
                await bu.send(msg, start + '\n```js\nundefined\n```');
            } else if (output.length > 1500) {
                let id = await bu.generateOutputPage(output, msg.channel);
                await bu.send(msg, start + '\n' + (config.general.isbeta ? 'http://localhost:8085/output/' : 'https://blargbot.xyz/output/') + id);
            } else
                await bu.send(msg, start + '\n```js\n' + output + '\n```');
        }
    }
}

module.exports = GevalCommand;
