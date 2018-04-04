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
            message: 'seval',
            code: code
        });
        console.log(code, res);
        await bu.send(msg, 'Sum result of all shards:\n```js\n' + res.result + '\n```');
    }
};