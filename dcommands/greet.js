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
e.usage = 'greet [message]';
e.info = 'Sets a greeting for when users join.';
e.longinfo = `<p>Sets a greeting for any new user who joins your guild. You can use the <a href="tags.html">tagging system</a>
        for more customization. For
        example:</p>

<pre><code>User&gt; blargbot greet Welcome, **{username}**. Please read #rules.
blargbot&gt; Greeting set. Simulation: Welcome, **User**. Please read #rules.
</code></pre>`;
e.category = bu.CommandType.COMMANDER;

e.execute = (msg, words, text) => {

    if (words.length == 1) {
        bu.guildSettings.remove(msg.channel.guild.id, 'greeting').then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Disabled greetings');
        });
        return;
    }
    var greeting = text.replace(`${words[0]} `, '');
    bu.guildSettings.set(msg.channel.guild.id, 'greeting', greeting).then(() => {
        bu.sendMessageToDiscord(msg.channel.id, `Greeting set. Simulation:
${tags.processTag(msg, greeting, '')}`);
    });
};