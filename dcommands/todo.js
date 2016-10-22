var e = module.exports = {};
var bu;



var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'todo [remove <item id> | add <item>]';
e.info = 'Access your todo list.\n'
    + 'To add items, do `todo add <item>`.\n'
    + 'To remove items, do `todo remove <item id>`, where item id is the number shown when you do `todo` by itself.';
e.longinfo = `<p>Access your todo list.</p><p>To add items, do <code>todo add &lt;item&gt;</code>.</p><p>To remove items, do <code>todo remove &lt;item id&gt;</code>, where item id is the number shown when you do <code>&lt;todo&gt;</code> by itself.</p>`;

e.execute = async function(msg, words) {
    let storedUser = await bu.r.table('user').get(msg.author.id).run();
    let todo = storedUser.todo;
    let modified = false;
    
    if (words.length > 1) {
        var itemid;
        switch (words[1].toLowerCase()) {
            case 'add':
                bu.logger.debug('adding');
                if (words.length < 3) {
                    bu.send(msg.channel.id, 'Not enough arguments given!');
                    return;
                }
                todo.push({
                    active: 1,
                    content: words.slice(2).join(' ')
                });
                modified = true;
                bu.send(msg.channel.id, 'Done! :ok_hand:');
                break;
            case 'remove':
                bu.logger.debug('removing');
                if (words.length < 3) {
                    bu.send(msg.channel.id, 'Not enough arguments given!');
                    return;
                }
                if (todo.length == 0) {
                    bu.send(msg.channel.id, 'There was nothing to delete.');
                } else {
                    let entry = todo.filter(m => m.active)[parseInt(words[2])];
                    let index = todo.indexOf(entry);
                    if (index < 0) {
                        bu.send(msg.channel.id, 'That entry could not be found!');
                    } else {
                        todo[index].active = false;
                        modified = true;
                        bu.send(msg.channel.id, 'Done! :ok_hand:');
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
        bu.r.table('user').get(msg.author.id).update({
            todo: todo
        }).run();
    }
};

var defaultOption = async function(msg, storedUser) {
    let todo = storedUser.todo.filter(m => m.active == 1);
    if (todo.length > 0) {
        var list = 'Here\'s your to-do list!\n';
        for (let i = 0; i < todo.length; i++) {
            list += `__**${i}.**__ ${todo[i].content}\n`;
        }
        bu.send(msg.channel.id, list);
    } else {
        bu.send(msg.channel.id, 'You have nothing on your list!');
    }
};