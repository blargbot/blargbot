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
e.usage = 'modlog [disable]';
e.info = 'Enables the modlog and sets it to the current channel. Doing \`modlog disable\` will disable it. '
    + 'When an admin does a moderation command (ban, unban, mute, unmute, and kick), the incident will be logged. '
    + 'The admin will then be encouraged to do \`reason <case number> <reason>\` to specify why '
    + 'the action took place.'
    + '\nBans and unbans are logged regardless of whether the \`ban\` or \`unban\` commands are used.';
e.longinfo = `<p>Enables the modlog and sets it to the current channel. Doing <code>modlog disable</code> will disable it.
        When an admin does a moderation command (ban, unban, mute, unmute, and kick), the incident will be logged.
        The admin will then be encouraged to do <code>reason &lt;case number&gt; &lt;reason&gt;</code> to specify why
        the action took place.</p>
    <p>Bans and unbans are logged regardless of whether the <code>ban</code> or <code>unban</code> commands are used.
    </p>`;

e.execute = (msg, words) => {

    if (words[1] == 'disable') {
        bu.guildSettings.remove(msg.channel.guild.id, 'modlog').then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog disabled!');
        });
    } else {
        bu.guildSettings.set(msg.channel.guild.id, 'modlog', msg.channel.id).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog channel set!');
        });
    }
};