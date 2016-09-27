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
e.usage = 'modlog [disable | clear [number to clear]]';
e.info = 'Enables the modlog and sets it to the current channel. Doing \`modlog disable\` will disable it. Doing \`modlog clear [number]\` will clear the specified number of cases from the modlog. Leaving \`number\` blank will clear all cases.'
    + 'When an admin does a moderation command (ban, unban, mute, unmute, and kick), the incident will be logged. '
    + 'The admin will then be encouraged to do \`reason <case number> <reason>\` to specify why '
    + 'the action took place.'
    + '\nBans and unbans are logged regardless of whether the \`ban\` or \`unban\` commands are used.';
e.longinfo = `<p>Enables the modlog and sets it to the current channel. Doing <code>modlog disable</code> will disable it. Doing <code>modlog disable</code> will disable it. Doing <code>modlog clear [number]</code> will clear the specified number of cases from the modlog. Leaving <code>number</code> blank will clear all cases.
        When an admin does a moderation command (ban, unban, mute, unmute, and kick), the incident will be logged.
        The admin will then be encouraged to do <code>reason &lt;case number&gt; &lt;reason&gt;</code> to specify why
        the action took place.</p>
    <p>Bans and unbans are logged regardless of whether the <code>ban</code> or <code>unban</code> commands are used.
    </p>`;

e.execute = (msg, words) => {
    if (words[1]) {
        switch (words[1].toLowerCase()) {
            case 'disable':
                bu.guildSettings.remove(msg.channel.guild.id, 'modlog').then(() => {
                    bu.sendMessageToDiscord(msg.channel.id, 'Modlog disabled!');
                });
                break;
            case 'clear':
                var limit = 0;
                if (words[2]) {
                    limit = parseInt(words[2]);
                    if (isNaN(limit)) {
                        bu.send(msg.channel.id, 'Invalid number of cases to clear');
                        return;
                    }
                }
                bu.db.query('select * from modlog where guildid = '
                    + bu.db.escape(msg.channel.guild.id) +
                    (limit > 0 ? ' order by caseid desc limit ' + bu.db.escape(limit) : '')
                    , (err, rows) => {
                        if (rows && rows.length > 0) {
                            var messages = [];
                            for (var i = 0; i < rows.length; i++) {
                                messages.push(rows[i].msgid);
                            }
                            bu.guildSettings.get(msg.channel.guild.id, 'modlog').then(channelid => {
                                bot.deleteMessages(channelid, messages);
                            });
                            bu.db.query('delete from modlog where guildid = '
                                + bu.db.escape(msg.channel.guild.id) +
                                (limit > 0 ? ' order by caseid desc limit ' + bu.db.escape(limit) : ''), () => {
                                    bu.send(msg.channel.id, 'Cleared ' + (limit > 0 ? limit : 'all') + ' cases from the modlog.');
                                });
                        }
                    });
                break;
        }
    } else {
        bu.guildSettings.set(msg.channel.guild.id, 'modlog', msg.channel.id).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog channel set!');
        });
    }
};