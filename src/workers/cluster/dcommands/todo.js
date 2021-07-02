const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

var defaultOption = async function (msg, storedUser) {
    let todo = storedUser.todo.filter(m => m.active == 1);
    if (todo.length > 0) {
        var list = 'Here\'s your to-do list!\n';
        for (let i = 0; i < todo.length; i++) {
            list += `**${i}**. ${todo[i].content}\n`;
        }
        bu.send(msg, await bu.filterMentions(list));
    } else {
        bu.send(msg, 'You have nothing on your list!');
    }
};

class TodoCommand extends BaseCommand {
    constructor() {
        super({
            name: 'todo',
            category: newbutils.commandTypes.GENERAL,
            usage: 'todo [remove <item id> | add <item>]',
            info: 'Access your todo list.\nTo add items, do `todo add <item>`.\nTo remove items, do `todo remove <item id>`, where item id is the number shown when you do `todo` by itself.'
        });
    }

    async execute(msg, words, text) {
        let storedUser = await r.table('user').get(msg.author.id).run();
        let todo = storedUser.todo;
        let modified = false;

        if (words.length > 1) {
            var itemid;
            switch (words[1].toLowerCase()) {
                case 'add':
                    console.debug('adding');
                    if (words.length < 3) {
                        bu.send(msg, 'Not enough arguments given!');
                        return;
                    }
                    todo.push({
                        active: 1,
                        content: words.slice(2).join(' ')
                    });
                    modified = true;
                    bu.send(msg, 'Done! :ok_hand:');
                    break;
                case 'remove':
                    console.debug('removing');
                    if (words.length < 3) {
                        bu.send(msg, 'Not enough arguments given!');
                        return;
                    }
                    if (todo.length == 0) {
                        bu.send(msg, 'There was nothing to delete.');
                    } else {
                        let entry = todo.filter(m => m.active)[parseInt(words[2])];
                        let index = todo.indexOf(entry);
                        if (index < 0) {
                            bu.send(msg, 'That entry could not be found!');
                        } else {
                            todo[index].active = false;
                            modified = true;
                            bu.send(msg, 'Done! :ok_hand:');
                        }
                    }
                    break;
                default:
                    defaultOption(msg, storedUser);
            }
        } else {
            defaultOption(msg, storedUser);
        }
        if (modified) {
            r.table('user').get(msg.author.id).update({
                todo: todo
            }).run();
        }
    }
}

module.exports = TodoCommand;
