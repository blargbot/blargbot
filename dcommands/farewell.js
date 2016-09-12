var e = module.exports = {};
var bu = require('./../util.js');
var tags = require('./../tags');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'farewell [message]';
e.info = 'Sets a farewell message for when users leave.';
e.longinfo = `<p>Sets a farewell message for any user who leaves your guild. You can use the <a href="tags.html">tagging
        system</a>
        for more customization. For
        example:</p>

    <pre><code>User&gt; blargbot farewell **{username}** has left. Bye!
blargbot&gt; Greeting set. Simulation: **User has left. Bye!
</code></pre>`;
e.category = bu.CommandType.COMMANDER;

e.execute = (msg, words, text) => {

    if (words.length == 1) {
        bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Disabled farewells');
        });
        return;
    }
    var farewell = text.replace(`${words[0]} `, '');
    bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell).then(() => {
        bu.sendMessageToDiscord(msg.channel.id, `Farewell set. Simulation:
${tags.processTag(msg, farewell, '')}`);
    });
};