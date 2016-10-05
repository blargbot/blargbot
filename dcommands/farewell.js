var e = module.exports = {};
var bu;
var tags = require('./../tags');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.COMMANDER;
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

e.execute = (msg, words, text) => {

    if (words.length == 1) {
        bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Disabled farewells');
        });
        return;
    }
    var farewell = words.slice(1).join(' ');
    bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell).then(() => {
        bu.sendMessageToDiscord(msg.channel.id, `Farewell set. Simulation:
${tags.processTag(msg, farewell, '')}`);
    });
};