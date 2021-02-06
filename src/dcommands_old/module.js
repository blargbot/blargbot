const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

var confirmIrc = false;
var confirmDiscord = false;

class ModuleCommand extends BaseCommand {
    constructor() {
        super({
            name: 'module',
            category: newbutils.commandTypes.CAT,
            usage: 'module <reload|unload|load> <name>',
            info: 'Loads, unloads, or reloads a module',
            flags: [{
                flag: 'c',
                word: 'command',
                desc: 'Do for a command (default)'
            },
            { flag: 't', word: 'tag', desc: 'Do for a tag' },
            { flag: 'e', word: 'event', desc: 'Do for an event' },
            { flag: 'u', word: 'utils', desc: 'Do for a util module' }]
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == config.discord.users.owner) {
            let input = newbutils.parse.flags(this.flags, words);
            if (input.undefined.length > 1) {
                let manager = CommandManager;
                if (input.u) manager = UtilManager;
                if (input.e) manager = EventManager;
                if (input.t) manager = TagManager;
                if (input.c) manager = CommandManager;
                switch (input.undefined.shift().toLowerCase()) {
                    case 'reload':
                        if (manager.reload(input.undefined[0]))
                            bu.send(msg, `:ok_hand: Reloaded ${manager.type} ${input.undefined[0]} :ok_hand:`);
                        else bu.send(msg, `:no_good: Failed to reload ${manager.type} ${input.undefined[0]} :no_good:`);
                        break;
                    case 'unload':
                        if (manager.unload(input.undefined[0]))
                            bu.send(msg, `:ok_hand: Unloaded ${manager.type} ${input.undefined[0]} :ok_hand:`);
                        else bu.send(msg, `:no_good: Failed to unload ${manager.type} ${input.undefined[0]} :no_good:`);
                        break;
                    case 'load':
                        if (manager.load(input.undefined[0]))
                            bu.send(msg, `:ok_hand: Loaded ${manager.type} ${input.undefined[0]} :ok_hand:`);
                        else bu.send(msg, `:no_good: Failed to load ${manager.type} ${input.undefined[0]} :no_good:`);
                        break;
                }
            } else {
                if (input.undefined[0] && input.undefined[0].toLowerCase() == 'discord') {
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
                } else if (input.undefined[0] && input.undefined[0].toLowerCase() == 'irc') {
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
                } else if (input.undefined[0] && input.undefined[0].toLowerCase() == 'bu') {
                    bu.emitter.emit('reloadBu');
                } else if (input.undefined[0] && input.undefined[0].toLowerCase() == 'cluster') {
                    cluster.reset();
                    bu.send(msg, `:ok_hand: Reloading the workers. :ok_hand:`);
                }
            }
        }
    }
}

module.exports = ModuleCommand;
