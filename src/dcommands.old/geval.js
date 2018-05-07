var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async (msg, words, text) => {
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
};