var e = module.exports = {};

var tags = require('../core/tags');

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'farewell [message]';
e.info = 'Sets a farewell message for when users leave.';
e.longinfo = `<p>Sets a farewell message for any user who leaves your guild. You can use the <a href="/tags/">tagging
        system</a>
        for more customization. For
        example:</p>

    <pre><code>User&gt; blargbot farewell **{username}** has left. Bye!
blargbot&gt; Greeting set. Simulation: **User has left. Bye!
</code></pre>`;

e.flags = [{
    flag: 'c',
    word: 'channel',
    desc: 'The channel to put the farewell messages in.'
}]

e.execute = async function (msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(() => {
            bu.send(msg, 'Disabled farewells');
        });
        return;
    }
    var farewell = input.undefined.join(' ');
    await bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell);
    let suffix = '';
    if (input.c) {
        let channelStr = input.c.join(' ');
        if (/[0-9]{17,23}/.test(channelStr)) {
            let channel = channelStr.match(/([0-9]{17,23})/)[1];
            if (!bot.getChannel(channel)) {
                suffix = `A channel could not be found from the channel input, so this message will go into the default channel. `;
            } else if (bot.channelGuildMap[channel] != msg.guild.id) {
                suffix = `The channel must be on this guild! `;
            } else {
                await bu.guildSettings.set(msg.guild.id, 'farewellchan', channel);
                suffix = `This farewell will be outputted in <#${channel}>. `;
            }
        }
    }
    let output = await tags.processTag(msg, farewell, '', undefined, msg.author.id, true);
    let message = bu.send(msg, `Farewell set. ${suffix}Simulation:
${output.contents}`);
    await bu.addReactions(message.channel.id, message.id, output.reactions);
};