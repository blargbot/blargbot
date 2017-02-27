var e = module.exports = {};



e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = false;

e.hidden = false;
e.usage = 'names [user] [flags]';
e.info = 'Returns the names that I\'ve seen the specified user have in the past 30 days.';
e.longinfo = `<p>Returns the names that I've seen the specified user have in the past 30 days.</p>`;
e.flags = [{
    flag: 'a',
    word: 'all',
    desc: 'Gets all the names.'
}, {
    flag: 'v',
    word: 'verbose',
    desc: 'Gets more information about the retrieved names.'
}];

const patrons = [
    'Nex',
    '196018922854678528'
];

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    let user;
    if (input.undefined.length == 0) {
        user = msg.author;
    } else {
        user = await bu.getUser(msg, input.undefined.join(' '));
    }
    if (!user) return;

    let storedUser = await bu.getCachedUser(user.id);
    let usernames = storedUser.usernames;


};