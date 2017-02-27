var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.longinfo = '<p></p>';

e.execute = async function(msg, words, text) {

};