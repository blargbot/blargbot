var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'module <reload|unload|load> <name>';
e.info = 'Loads, unloads, or reloads a module';

e.flags = [{
    flag: 'c',
    word: 'command',
    desc: 'Do for a command (default)'
}, {
    flag: 't',
    word: 'tag',
    desc: 'Do for a tag'
}, {
    flag: 'e',
    word: 'event',
    desc: 'Do for an event'
}];

var confirmIrc = false;
var confirmDiscord = false;
e.execute = (msg, words) => {
    if (msg.author.id == bu.CAT_ID) {
        let input = bu.parseInput(e.flags, words);
        let manager = CommandManager;
        if (input.e) manager = EventManager;
        if (input.t) manager = TagManager;
        if (input.c) manager = CommandManager;

        if (words.length > 1) {
            switch (words.shift().toLowerCase()) {
                case 'reload':
                    if (manager.reload(words[0]))
                        bu.send(msg, `:ok_hand: Reloaded ${manager.type} ${words[0]} :ok_hand:`);
                    else bu.send(msg, `:no_good: Failed to reload ${manager.type} ${words[0]} :no_good:`);
                    break;
                case 'unload':
                    if (manager.unload(words[0]))
                        bu.send(msg, `:ok_hand: Unloaded ${manager.type} ${words[0]} :ok_hand:`);
                    else bu.send(msg, `:no_good: Failed to unload ${manager.type} ${words[0]} :no_good:`);
                    break;
                case 'load':
                    if (manager.load(words[0]))
                        bu.send(msg, `:ok_hand: Loaded ${manager.type} ${words[0]} :ok_hand:`);
                    else bu.send(msg, `:no_good: Failed to load ${manager.type} ${words[0]} :no_good:`);
                    break;
            }
        } else {
            if (words[0] && words[0].toLowerCase() == 'discord') {
                if (!confirmDiscord) {
                    bu.send(msg, 'I really hope you know what you\'re doing. ' +
                        'Type that command again to confirm.');
                    confirmDiscord = true;
                } else {
                    bu.send(msg, `:ok_hand: Reloading the discord module :ok_hand:`)
                        .then(() => {
                            bu.emitter.emit('reloadDiscord');
                        });
                }
            } else if (words[0] && words[0].toLowerCase() == 'irc') {
                if (!confirmIrc) {
                    bu.send(msg, `I really hope you know what you're doing. ` +
                        `Type that command again to confirm.`);
                    confirmIrc = true;
                } else {
                    bu.send(msg, `:ok_hand: Reloading the irc module :ok_hand:`)
                        .then(() => {
                            bu.emitter.emit('reloadIrc');
                        });
                }
            } else if (words[0] && words[0].toLowerCase() == 'bu') {
                bu.emitter.emit('reloadBu');
            } else if (words[0] && words[0].toLowerCase() == 'cluster') {
                cluster.reset();
                bu.send(msg, `:ok_hand: Reloading the workers. :ok_hand:`);
            }
        }
    }
};