var e = module.exports = {};
var bu;

const async = require('asyncawait/async');
const await = require('asyncawait/await');
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
e.info = `Creates a custom command, using the BBTag language.

Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the 'ccommand' command. For more in-depth command customization, see the \`commandperm\` command.

__**Usage:**__
  **cc create <name> <content>** - creates a new tag with given name and content
  **cc edit <name> <content>** - edits an existing tag with given content, provided that you were the one who created it
  **cc set <name> <content>** - provides the functionality of \`create\` and \`edit\` in a single command
  **cc delete <name>** - deletes the tag with given name, provided that you own it
  **cc rename <tag1> <tag2>** - renames the tag by the name of \`tag1\` to \`tag2\`
  **cc raw <name>** - displays the raw code of a tag
  **cc help** - shows this message
  
For more information about BBTag, visit https://blargbot.xyz/tags`;
e.longinfo = `<p>Creates a custom command using the <a href="/tags">BBTag language</a>. Once created, whenever you say the command name, blargbot will respond with the
        command content. For example:</p>

<pre><code>User&gt; blargbot ccommand create test Hello, {username}. This is a test command.
blargbot&gt; Created command test
User&gt; blargbot test
blargbot&gt; Hello, User. This is a test command.
</code></pre>

  <p>Custom commands take precedent over all other commands. As such, you can use it to overwrite commands,
        or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no
        output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the 'ccommand'
        command. For more in-depth command customization, see the <code>commandperm</code> command.</p>

<p>Commands:</p>
<pre><code>cc create &lt;name&gt; &lt;content&gt;</code></pre>
    <p>
        Creates a ccommand with the given name and content. The name must be unique.
    </p>
    <pre><code>cc edit &lt;name&gt; &lt;content&gt;</code></pre>
    <p>Edits an existing ccommand.</p>
    <pre><code>cc set &lt;name&gt; &lt;content&gt;</code></pre>
    <p>Provides the functionality of create and edit in a single command.</p>
    <pre><code>cc delete &lt;name&gt;</code></pre>
    <p>Deletes the specified ccommand.</p>
    <pre><code>cc rename &lt;name&gt; &lt;new name&gt;</code></pre>    
    <p>Renames an existing ccommand to something else.<p>
    <pre><code>cc raw &lt;name&gt;</code></pre>
    <p>Displays the raw code of a given ccommand.</p>
    <pre><code>cc help</code></pre>
    <p>Gets basic ccommand help.</p>`;
e.alias = ['cc'];
e.execute = async((msg, words, text) => {
    if (words[1]) {
        let storedTag;
        switch (words[1].toLowerCase()) {
            case 'create':
                if (words.length > 3) {
                    storedTag = await(bu.ccommand.get(msg.channel.guild.id, words[2]));
                    if (storedTag) {
                        bu.send(msg.channel.id, 'That ccommand already exists!');
                        break;
                    }
                    await(bu.ccommand.set(msg.channel.guild.id, words.slice(3).join(' ')));
                    bu.sendMessageToDiscord(msg.channel.id, `✅ Tag \`${title}\` created. ✅`);
                } else {
                    bu.send(msg.channel.id, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'edit':
                break;
            case 'set':
                break;
            case 'delete':
                break;
            case 'rename':
                break;
            case 'raw':
                break;
            case 'help':
                bu.send(msg.channel.id, e.info);
                break;
            default:
                bu.send(msg.channel.id, 'Improper usage. Do \`help ccommand\` for more details.');
                break;

        }
    } else {
        bu.send(msg.channel.id, 'Improper usage. Do \`help ccommand\` for more details.');
    }

    if (words.length == 1) {
        bu.sendMessageToDiscord(msg.channel.id, `Do \`help\` for a list of commands.
See https://blargbot.xyz/commands/#ccommand for usage instructions.`);
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
        bu.ccommand.set(msg.channel.guild.id, words[1], words.slice(2).join(' ')).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, `Set command ${words[1]}`);
        });
    }
    // bu.saveConfig();
});