var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'cat';
e.info = 'Gets a picture of a cat.';
e.longinfo = '<p>Displays a picture of a cat, taken from <a href="http://random.cat/">random.cat</a></p>';


e.execute = async function (msg) {
    var output;
    let res = await bu.request('http://random.cat/meow');
    output = JSON.parse(res.body);
    bu.sendFile(msg.channel.id, '', output.file);
};