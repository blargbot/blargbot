var util = require('util');

var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'module <reload|unload|load> <name>';
e.info = 'Loads, unloads, or reloads a command module';

var confirmIrc = false;
var confirmDiscord = false;
e.execute = async function(msg, words) {
    if (msg.author.id == bu.CAT_ID) {
        let tags = bu.vars.tags;
        for (let tag in tags) {
            await r.table('tag').get(tag).update({
                vars: tags[tag]
            }).run();
        }

        let authors = bu.vars.authorTags;
        for (let author in authors) {
            await r.table('user').get(author).update({
                vars: authors[author]
            }).run();
        }
        bu.send(msg, 'done');
    }
};