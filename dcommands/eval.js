var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT;

e.execute = (msg, words, text) => {
    bu.emitter.emit('eval', msg, text);
};