var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'ccommand <command name> <command content>';
e.info = `Creates a custom command, using the BBTag language.

Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the 'ccommand' command. For more in-depth command customization, see the \`commandperm\` command.

__**Usage:**__
  **cc create <name> <content>** - creates a ccommand with given name and content
  **cc edit <name> <content>** - edits an existing ccommand with given content
  **cc set <name> <content>** - provides the functionality of \`create\` and \`edit\` in a single command
  **cc delete <name>** - deletes the ccommand with given name, provided that you own it
  **cc rename <tag1> <tag2>** - renames the ccommand by the name of \`ccommand1\` to \`ccommand2\`
  **cc raw <name>** - displays the raw code of a ccommand
  **cc setrole <name> <role names...>** - sets the roles required to execute the ccommand
  **cc help** - shows this message
  **cc sethelp** <name> [help text] - set the help message for a custom command
  
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
    <pre><code>cc setrole &lt;name&gt; &lt;role names...&gt;</code></pre>
    <p>sets the roles required to execute the ccommand</p>
    <pre><code>cc help</code></pre>
    <p>Gets basic ccommand help.</p>
    <pre><code>cc sethelp &lt;name&gt; &#91;help text&#93;</code></pre>
    <p>sets the help message for the given ccommand</p>`;
e.alias = ['cc'];
e.execute = async function(msg, words, text) {
    logger.debug('Text:', text);
    if (words[1]) {
        let storedTag;
        let content;
        switch (words[1].toLowerCase()) {
            case 'setrole':
                if (words.length > 3) {
                    storedTag = await bu.ccommand.get(msg.guild.id, words[2]);
                    if (!storedTag) {
                        bu.send(msg, 'That ccommand doesn\'t exist!');
                        return;
                    }
                    await bu.ccommand.set(msg.guild.id, words[2], {
                        content: storedTag.content || storedTag,
                        roles: words.slice(3)
                    });
                    bu.send(msg, `Set the custom role requirements of '${words[2]}' to \`\`\`fix\n${words.slice(3).join(', ')}\n\`\`\` `)
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'create':
                if (words.length > 3) {
                    storedTag = await bu.ccommand.get(msg.channel.guild.id, words[2]);
                    if (storedTag) {
                        bu.send(msg, 'That ccommand already exists!');
                        break;
                    }
                    content = bu.splitInput(text, true).slice(3).join(' ');
                    await bu.ccommand.set(msg.channel.guild.id, words[2], {
                        content,
                        author: msg.author.id
                    });
                    bu.send(msg, `✅ Custom command \`${words[2]}\` created. ✅`);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'edit':
                if (words.length > 3) {
                    storedTag = await bu.ccommand.get(msg.channel.guild.id, words[2]);
                    if (!storedTag) {
                        bu.send(msg, 'That ccommand doesn\'t exist!');
                        break;
                    }
                    content = bu.splitInput(text, true).slice(3).join(' ');
                    await bu.ccommand.set(msg.channel.guild.id, words[2], {
                        content,
                        author: msg.author.id
                    });
                    bu.send(msg, `✅ Custom command \`${words[2]}\` edited. ✅`);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'set':
                if (words.length > 3) {
                    content = bu.splitInput(text, true).slice(3).join(' ');
                    await bu.ccommand.set(msg.channel.guild.id, words[2], {
                        content,
                        author: msg.author.id
                    });
                    bu.send(msg, `✅ Custom command \`${words[2]}\` set. ✅`);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'delete':
                if (words.length > 2) {
                    storedTag = await bu.ccommand.get(msg.channel.guild.id, words[2]);
                    if (!storedTag) {
                        bu.send(msg, 'That ccommand doesn\'t exist!');
                        break;
                    }
                    await bu.ccommand.remove(msg.channel.guild.id, words[2]);
                    bu.send(msg, `✅ Custom command \`${words[2]}\` deleted. ✅`);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'rename':
                if (words.length > 3) {
                    storedTag = await bu.ccommand.get(msg.channel.guild.id, words[2]);
                    if (!storedTag) {
                        bu.send(msg, `The ccommand ${words[2]} doesn\'t exist!`);
                        break;
                    }
                    let newTag = await bu.ccommand.get(msg.channel.guild.id, words[3]);
                    if (newTag) {
                        bu.send(msg, `The ccommand ${words[3]} already exists!`);
                    }
                    await bu.ccommand.rename(msg.channel.guild.id, words[2], words[3]);
                    bu.send(msg, `✅ Custom command \`${words[2]}\` renamed. ✅`);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'raw':
                if (words.length > 2) {
                    storedTag = await bu.ccommand.get(msg.channel.guild.id, words[2]);
                    if (!storedTag) {
                        bu.send(msg, 'That ccommand doesn\'t exist!');
                        break;
                    }
                    let lang = '';
                    if (storedTag.content) storedTag = storedTag.content;
                    if (/\{lang;.*?}/i.test(storedTag)) {
                        lang = storedTag.match(/\{lang;(.*?)}/i)[1];
                    }
                    content = storedTag.replace(/`/g, '`\u200B');

                    bu.send(msg, `The raw code for ${words[2]} is\`\`\`${lang}\n${content}\n\`\`\``);
                } else {
                    bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                }
                break;
            case 'sethelp':
                if (words.length > 3) {
                    content = bu.splitInput(text, true).slice(3).join(' ')
                    var message = "";
                    if (!await bu.ccommand.sethelp(msg.channel.guild.id, words[2], content)){
                        message = `✅ Custom command \`${words[2]}\` set. ✅`;
                    } else {
                        message = `Custom command \`${words[2]}\` not found. Do \`help\` for a list of all commands, including ccommands`;
                    }

                    bu.send(msg, message);
                } else {
                    await bu.ccommand.sethelp(msg.channel.guild.id, words[2], undefined);
                    bu.send(msg, `✅ Help text for \`${words[2]}\` removed. ✅`);
                }
                break;
            case 'help':
                bu.send(msg, e.info);
                break;
            default:
                bu.send(msg, 'Improper usage. Do \`help ccommand\` for more details.');
                break;
        }
    } else {
        bu.send(msg, 'Improper usage. Do \`help ccommand\` for more details.');
    }
};