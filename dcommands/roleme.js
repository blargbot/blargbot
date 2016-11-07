var e = module.exports = {};





e.init = () => {


    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'roleme <list | add | remove>';
e.info = 'A roleme is a system to automatically give/remove roles to a user when they say a specific catchphrase. You can make these catchphrases anything you want, case sensitive/insensitive, and only activate in specific channels. The roleme command has three subcommands:\n\n**list**: lists all the rolemes active on the guild.\n**add**: adds a roleme to the guild. Just follow the instructions.\n**remove**: returns a list of rolemes so you can choose one to remove.';
e.long = `<p>A roleme is a system to automatically give/remove roles to a 
user when they say a specific catchphrase. You can make these catchphrases 
anything you want, case sensitive/insensitive, and only activate in 
specific channels. The roleme command has three subcommands:</p>
<ul><li>list: lists all the rolemes active on the guild.</li>
<li>add: adds a roleme to the guild. Just follow the instructions.</li>
<li>remove: returns a list of rolemes so you can choose one to remove.<\li><\\ul>`;

e.execute = async function(msg, words) {
    if (words[1]) {
        bu.dirtyCache[msg.guild.id] = true;

        let storedGuild = await bu.getGuild(msg.guild.id);
        let roleme = storedGuild.roleme;
        let res, rolemeString, rolemeList;
        if (roleme == undefined) roleme = [];
        switch (words[1].toLowerCase()) {
            case 'add':
                let addList = [];
                let resList;
                res = (await bu.awaitMessage(msg, 'List all the roles that this will add, each on a new line. If you do not wish any roles, type `0`.')).content;
                if (res != 0) {
                    resList = res.split('\n');
                    for (let i = 0; i < resList.length; i++) {
                        let role = await bu.getRole(msg, resList[i]);
                        // logger.debug(role);
                        if (role)
                            addList.push(role.id);
                    }
                }
                let removeList = [];
                res = (await bu.awaitMessage(msg, 'List all the roles that this will remove, each on a new line. If you do not wish any roles, type `0`.')).content;
                if (res != 0) {
                    resList = res.split('\n');
                    for (let i = 0; i < resList.length; i++) {
                        let role = await bu.getRole(msg, resList[i]);
                        if (role)
                            removeList.push(role.id);
                    }
                }
                if (addList.length == 0 && removeList.length == 0) {
                    await bu.send(msg, 'You must have some roles!');
                    break;
                }
                let channelList = [];
                res = (await bu.awaitMessage(msg, 'Mention all the channels that this will apply to (in #<channelname> format). Alternatively, don\'t mention any channels to make it apply everywhere.'));
                channelList = res.channelMentions;
                let activationMessage = (await bu.awaitMessage(msg, 'Type the sentence that users should type in order for this action to happen.')).content;
                let caseSensitive = (await bu.awaitMessage(msg, 'Type `1` if the previous sentence should be case-sensitive. Type anything else to make it match regardless of capitalization.'));
                caseSensitive = caseSensitive.content == '1' ? true : false;
                logger.debug(addList, removeList);
                roleme.push({
                    add: addList,
                    remove: removeList,
                    channels: channelList,
                    message: activationMessage,
                    casesensitive: caseSensitive,
                });
                await r.table('guild').get(msg.channel.guild.id).update({
                    roleme: roleme
                }).run();
                bu.send(msg, 'Roleme added!');
                break;
            case 'remove':
                if (roleme.length == 0) {
                    await bu.send(msg, 'You have no rolemes created!');
                    break;
                }
                rolemeString = 'Here are the rolemes on your guild:\n```prolog\n';
                rolemeList = roleme.map(m => {
                    return `  Message: ${m.message}
  Channel(s): ${m.channels.join(' ')}`;
                });
                for (let i = 0; i < rolemeList.length; i++) {
                    rolemeString += `${i + 1}:\n${rolemeList[i]}\n`;
                }
                if (rolemeString.length > 2000) rolemeString = rolemeString.substring(0, 1850) + '...';
                rolemeString += '```\nPlease type the number of the roleme you wish to remove, or `c` to cancel.';
                let resMsg = (await bu.awaitMessage(msg, rolemeString, m => (!isNaN(parseInt(m.content)) && parseInt(m.content) > 0 && parseInt(m.content) <= rolemeList.length) || m.content.toLowerCase() == 'c'));
                if (resMsg.content.toLowerCase() == 'c') {
                    await bu.send(msg, 'Remove canceled!');
                    break;
                }
                roleme.splice(parseInt(resMsg.content) - 1, 1);
                storedGuild.roleme = roleme;
                await r.table('guild').get(msg.channel.guild.id).replace(storedGuild).run();
                let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                await bu.send(msg, 'Done! :ok_hand:');
                break;
            case 'list':
                if (roleme.length == 0) {
                    await bu.send(msg, 'You have no rolemes created!');
                    break;
                }
                rolemeString = 'Here are the rolemes on your guild:\n```prolog\n';
                rolemeList = roleme.map(m => {
                    return `  Message: ${m.message}
  Channel(s): ${m.channels.join(' ')}`;
                });
                for (let i = 0; i < rolemeList.length; i++) {
                    rolemeString += `${i + 1}:\n${rolemeList[i]}\n`;
                }
                if (rolemeString.length > 2000) rolemeString = rolemeString.substring(0, 1994) + '...';
                rolemeString += '```';
                bu.send(msg, rolemeString);
                break;
            default:
                bu.send(msg, e.info);
                break;
        }
    } else {
        bu.send(msg, e.info);
    }
};