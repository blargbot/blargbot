var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'ship <user1> <user2>';
e.info = 'Gives you the ship name for two users.';
e.longinfo = '<p>Gives you the ship name for two users.</p>';

e.execute = async function(msg, words, text) {
    if (words.length > 2) {
        let users = [await bu.getUser(msg, words[1]), await bu.getUser(msg, words[2])];
        if (!users[0] || !users[1]) {
            return;
        }
        bu.shuffle(users);
        let firstPart = users[0].username.substring(0, users[0].username.length / 2);
        let lastPart = users[1].username.substring(users[1].username.length / 2);
        bu.send(msg, `Your shipname is **${firstPart}${lastPart}**!`);
    } else {
        bu.send(msg, 'You have to tell me who you want to ship!');
    }
};