var bu = require('./../util.js');
var util = require('util');

var e = module.exports = {};

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'module <reload|unload|load> <name>';
e.info = 'Loads, unloads, or reloads a command module';
e.category = bu.CommandType.CAT;


var confirmIrc = false;
var confirmDiscord = false;
e.execute = (msg, words) => {
    if (msg.author.id == bu.CAT_ID) {
        words.shift();
        console.log(util.inspect(words));
        if (words.length > 1) {
            switch (words.shift().toLowerCase()) {
                case 'reload':
                    bu.emitter.emit('reloadCommand', words[0]);
                    // console.log(words[0])
                    bu.sendMessageToDiscord(msg.channel.id, `:ok_hand: Reloaded command ${words[0]} :ok_hand:`);
                    break;
                case 'unload':
                    bu.emitter.emit('unloadCommand', words[0]);
                    //    console.log(words[0])
                    bu.sendMessageToDiscord(msg.channel.id, `:ok_hand: Unloaded command ${words[0]} :ok_hand:`);


                    break;
                case 'load':
                    bu.emitter.emit('loadCommand', words[0]);
                    //    console.log(words[0])
                    bu.sendMessageToDiscord(msg.channel.id, `:ok_hand: Loaded command ${words[0]} :ok_hand:`);

                    break;

            }
        } else {
            if (words[0] && words[0].toLowerCase() == 'discord') {
                //   console.log('meow')
                if (!confirmDiscord) {
                    bu.sendMessageToDiscord(msg.channel.id, 'I really hope you know what you\'re doing. ' +
                        'Type that command again to confirm.');
                    confirmDiscord = true;
                    // }
                } else {
                    bu.sendMessageToDiscord(msg.channel.id, `:ok_hand: Reloading the discord module :ok_hand:`)
                        .then(() => {
                            bu.emitter.emit('reloadDiscord');
                        });
                    // }
                    // break;
                }
            } else if (words[0] && words[0].toLowerCase() == 'irc') {
                if (!confirmIrc) {
                    bu.sendMessageToDiscord(msg.channel.id, `I really hope you know what you're doing. ` +
                        `Type that command again to confirm.`);
                    confirmIrc = true;
                    //     }
                } else {
                    bu.sendMessageToDiscord(msg.channel.id, `:ok_hand: Reloading the irc module :ok_hand:`)
                        .then(() => {
                            bu.emitter.emit('reloadIrc');
                        });
                }
                //   }
            }
        }
    }
};
