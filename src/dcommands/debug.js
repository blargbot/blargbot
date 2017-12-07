var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg, words, text) => {
    if (msg.author.id == bu.CAT_ID) {
        let debug = console.toggleDebug();
        if (debug) bu.send(msg, 'Debug logging is now enabled.');
        else bu.send(msg, 'Debug logging is now disabled.');
    }
};