var e = module.exports = {};

var tags = require('./../tags');




e.init = () => {
    
    


    e.category = bu.CommandType.COMMANDER;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'greet [message]';
e.info = 'Sets a greeting for when users join.';
e.longinfo = `<p>Sets a greeting for any new user who joins your guild. You can use the <a href="/tags/">tagging system</a>
        for more customization. For
        example:</p>

<pre><code>User&gt; blargbot greet Welcome, **{username}**. Please read #rules.
blargbot&gt; Greeting set. Simulation: Welcome, **User**. Please read #rules.
</code></pre>`;

e.execute = async function(msg, words) {

    if (words.length == 1) {
        bu.guildSettings.remove(msg.channel.guild.id, 'greeting').then(() => {
            bu.send(msg, 'Disabled greetings');
        });
        return;
    }
    var greeting = words.slice(1).join(' ');
    await bu.guildSettings.set(msg.channel.guild.id, 'greeting', greeting);
    bu.send(msg, `Greeting set. Simulation:
${await tags.processTag(msg, greeting, '')}`);
};