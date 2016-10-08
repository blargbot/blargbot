var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'commandperm < list | setrole <commandname> [role name] | setperm <commandname> [perm number] >';
e.info = `Changes command-specific usage permissions.
**__list__** - shows a list of modified commands (role required/perms required)
**__setrole__** - sets the role required in order to use the command. Set to blank to disable the custom role requirement.
**__setperm__** - sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated at <https://discordapi.com/permissions.html>. Set to blank to disable the custom permission options.`;
e.longinfo = `<p>Changes command-specific usage permissions.</p>
<table>
<thead>
<tr><th>argument</th>
<th>description</th></tr>
</thead>
<tbody>
<tr><th>list</th>
<th>shows a list of modified commands (role required/perms required)</th></tr>
<tr><th>setrole</th>
<th>sets the role required in order to use the command</th></tr>
<tr><th>setperm</th>
<th>sets the permissions required in order to bypass the role requirement (requires \`permoverride\` in the settings command to be enabled). This has to be a permission number, which can be calculated <a href="https://discordapi.com/permissions.html">here</a></th></tr>
</tbody>
</table>`;

e.execute = (msg, words) => {
    if (words.length >= 2) {
        let commandName;
        switch (words[1].toLowerCase()) {
            case 'list':
                bu.db.query(`select commandname, rolename, permission from commandperm where guildid = `
                    + bu.db.escape(msg.channel.guild.id), (err, rows) => {
                        let message = '__Modified Commands:__\n';
                        let commandList = rows.filter(m => m.rolename || m.permission).map(m =>
                            `**${m.commandname}** ${m.rolename ? ' - ROLE: ' + m.rolename : ''}${m.permission ? ' - PERM: ' + m.permission : ''}`
                        );
                        if (commandList.length > 0) message += commandList.join('\n');
                        else message += 'No modified commands found.';
                        bu.send(msg.channel.id, message);
                    });
                break;
            case 'setrole':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                }
                if (bu.commandList.hasOwnProperty(words[2].toLowerCase())) {
                    commandName = bu.commandList[words[2].toLowerCase()].name;
                    if (bu.commands[commandName].category == bu.CommandType.CAT
                        || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                        bu.logger.debug('no ur not allowed');
                        bu.send(msg.channel.id, `That's not a command!`);
                        return;
                    }

                    if (words.length == 3) {
                        bu.db.query(`insert into commandperm (guildid, commandname, rolename) values (?, ?, null)
                on duplicate key update rolename = values(rolename)`, [msg.channel.guild.id, words[2].toLowerCase()], (err) => {
                                if (err) bu.logger.error(err);
                                bu.send(msg.channel.id, `Removed the custom role requirement from command \`${words[2].toLowerCase()}\``);
                            });
                    } else if (words.length >= 4) {
                        bu.db.query(`insert into commandperm (guildid, commandname, rolename) values (?, ?, ?)
                on duplicate key update rolename = values(rolename)`, [msg.channel.guild.id, words[2].toLowerCase(), words.splice(3, words.length).join(' ')], (err) => {
                                if (err) bu.logger.error(err);
                                bu.send(msg.channel.id, `Added custom role requirement to command \`${words[2].toLowerCase()}\``);
                            });
                    }
                } else {
                    bu.send(msg.channel.id, `That's not a command!`);
                }
                break;
            case 'setperm':
                if (!words[2]) {
                    bu.send(msg.channel.id, 'Not enough arguments provided!');
                }
                if (bu.commandList.hasOwnProperty(words[2].toLowerCase())) {
                    commandName = bu.commandList[words[2].toLowerCase()].name;
                    if (bu.commands[commandName].category == bu.CommandType.CAT
                        || bu.commands[commandName].category == bu.CommandType.MUSIC) {
                        bu.logger.debug('no ur not allowed');
                        bu.send(msg.channel.id, `That's not a command!`);
                        return;
                    }
                    if (words.length == 3) {
                        bu.db.query(`insert into commandperm (guildid, commandname, permission) values (?, ?, null)
                on duplicate key update rolename = values(rolename)`, [msg.channel.guild.id, words[2].toLowerCase()], (err) => {
                                if (err) bu.logger.error(err);
                                bu.send(msg.channel.id, `Removed the custom permission options from command \`${words[2].toLowerCase()}\``);
                            });
                    } else if (words.length >= 4) {
                        let allow = parseInt(words[3]);
                        if (!isNaN(allow))
                            bu.db.query(`insert into commandperm (guildid, commandname, permission) values (?, ?, ?)
                on duplicate key update permission = values(permission)`, [msg.channel.guild.id, words[2].toLowerCase(), allow], (err) => {
                                    if (err) bu.logger.error(err);
                                    bu.send(msg.channel.id, `Added custom permission options to command \`${words[2].toLowerCase()}\``);
                                });
                        else
                            bu.send(msg.channel.id, `The permissions must be in a numeric format. See <https://discordapi.com/permissions.html> for more details.`);
                    }
                }
                break;
            default:
                bu.send(msg.channel.id, `Unrecognized arguments provided. Please do \`b!help commandperm\` for more details.`);
                break;
        }
    } else {
        bu.send(msg.channel.id, 'Not enough arguments provided!');
    }

};