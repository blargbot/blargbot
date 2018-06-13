const User = require('eris/lib/structures/User');

bot.on('messageReactionAdd', async function (msg, emoji, user) {
    let emojiString = emoji.name;
    if (emoji && emoji.id)
        emojiString = `${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}`;

    if (!msg.author) {
        msg = await bot.getMessage(msg.channel.id, msg.id);
    }
    user = await bu.getUserById(user);
    handleAwaitReaction(msg, emojiString, user);
});

function handleAwaitReaction(msg, emoji, user) {
    let messageEvents, userEvents;
    if ((messageEvents = bu.awaitReactions[msg.id]) &&
        (userEvents = messageEvents[user.id]) &&
        Array.isArray(userEvents)) {
        for (const event of userEvents)
            bu.emitter.emit(event, msg, emoji, user);
    }
}