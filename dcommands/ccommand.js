var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.COMMANDER;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'ccommand <command name> <command content>';
e.info = 'Creates a custom command.';
e.longinfo = `<p>Creates a simple custom command. Once created, whenever you say the command name, blargbot will respond with the
        command content. For example:</p>

<pre><code>User&gt; blargbot ccommand test This is a test command.
blargbot&gt; Created command test
User&gt; blargbot test
blargbot&gt; This is a test command.
</code></pre>

    <p>You can also use the <a href="tags.html">tagging system</a> to make more powerful commands.</p>

<pre><code>input: Hello, {username}.
output: Hello, User
</code></pre>

    <p>To remove a custom command, simply do ccommand without command content. For example:</p>

<pre><code>User&gt; blargbot ccommand test
blargbot&gt; Removed command test
User&gt; blargbot test
*no response from blargbot*
</code></pre>

    <p>Finally, custom commands take precedent over all other commands. As such, you can use it to overwrite commands,
        or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no
        output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the 'ccommand'
        command.</p>`;

e.execute = (msg, words, text) => {
    //  if (!bu.hasPerm(msg, "Bot Commander")) {
    //      return;
    //   }

    if (words.length == 1) {
        bu.sendMessageToDiscord(msg.channel.id, `Do \`help\` for a list of commands.
See http://ratismal.github.io/blargbot/commands.html#ccommand for usage instructions.`);
        return;
    }

    if (words[1].toLowerCase() === 'ccommand') {
        bu.sendMessageToDiscord(msg.channel.id, `You cannot overwrite \`ccommand\``);
        return;
    }
    if (words.length == 2) {
        bu.ccommand.remove(msg.channel.guild.id, words[1]).then(fields => {
            if (fields.affectedRows > 0)
                bu.sendMessageToDiscord(msg.channel.id, `Deleted command ${words[1]}`);
            else
                bu.sendMessageToDiscord(msg.channel.id, `Command ${words[1]} does not exist.`);

        });
    } else {
        bu.ccommand.set(msg.channel.guild.id, words[1], text.replace(`${words[0]} ${words[1]} `, '')).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, `Set command ${words[1]}`);
        });
    }
    // bu.saveConfig();
};