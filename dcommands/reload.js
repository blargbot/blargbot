var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.CAT;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg) => {
    if (msg.author.id === bu.CAT_ID) {
        bu.emitter.emit('reloadConfig');
        bu.send(msg, ':ok_hand:');
    }
};