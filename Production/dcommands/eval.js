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
    bu.emitter.emit('eval', msg, text);
};