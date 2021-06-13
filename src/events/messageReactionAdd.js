
bot.on('messageReactionAdd', async function (msg, emoji, user) {
    let emojiString = emoji.name;
    if (emoji && emoji.id)
        emojiString = `${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}`;

    if (!msg.author) {
        try {
            msg = await bot.getMessage(msg.channel.id, msg.id);
        } catch (err) {
            console.warn(`Was unable to retrieve reacted message?\n- ${err.message}\n- Channel: ${msg.channel.id}\n- Bot has seen channel: ${!!bot.getChannel(msg.channel.id)}\n- Emoji: ${JSON.stringify(emoji)}`);
            return;
        }
    }
    if (msg && msg.guild) {
        user = await bu.getUserById(user.id);
        handleAwaitReaction(msg, emojiString, user);

        const member = msg.channel.guild.members.get(user.id);
        if (msg.channel.id === '481857751891443722' && member.roles.includes('280159905825161216') && msg.author.id === bot.user.id) {
            let command = CommandManager.built['autoresponse'];
            if (!emoji.id && [command.approved, command.rejected].includes(emoji.name)) {
                await command.whitelist(msg, emoji.name === command.approved);
            }
        }
    }
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