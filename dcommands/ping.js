var bu = require('./../util.js');
var moment = require('moment');

var e = module.exports = {};

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'ping';
e.info = 'Pong!';
e.category = bu.CommandType.GENERAL;

var messages = [
    `Existance is a lie.`,
    `You're going to die some day, perhaps soon.`,
    `Nothing matters.`,
    `Where do you get off?`,
    `There is nothing out there.`,
    `You are all alone in an infinite void.`,
    `Truth is false.`,
    `Forsake everything.`,
    `Your existence is pitiful.`,
    `We are all already dead.`,
    `Eat Arby's.`
];

e.execute = (msg) => {
    var message = messages[bu.getRandomInt(0, messages.length - 1)];
    bot.createMessage(msg.channel.id, message).then((msg2) => {
        var ms = moment().diff(moment(msg2.timestamp));
        bot.editMessage(msg2.channel.id, msg2.id, `Pong! (${ms}ms)\u202e`);
    
        return msg2;
    }).catch(err => console.log(err.stack));
};