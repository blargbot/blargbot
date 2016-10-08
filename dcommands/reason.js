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
e.usage = 'reason <caseid | latest> <reason>';
e.info = 'Sets the reason for an action on the modlog.';
e.longinfo = `<p>Sets the reason for an action on the modlog.</p>`;

e.execute = (msg, words) => {
    bu.guildSettings.get(msg.channel.guild.id, 'modlog').then(val => {
        if (val) {
            if (words.length >= 3) {
                var latest = false;
                if (words[1].toLowerCase() == 'latest') {
                    latest = true;
                }
                words.shift();
                var caseid = parseInt(words.shift());
                bu.logger.debug(caseid);
                bu.db.query(`select msgid, modid, guildsetting.value as channelid from modlog 
        inner join guildsetting 
            on modlog.guildid = guildsetting.guildid and guildsetting.name = "modlog"
        where modlog.guildid = ? ${latest ? 'order by caseid desc limit 1' : 'and caseid = ' + bu.db.escape(caseid)}`,
                    [msg.channel.guild.id], (err, row) => {
                        if (err) {
                            bu.logger.error(err);
                            return;
                        }
                        if (row[0]) {
                            bot.getMessage(row[0].channelid, row[0].msgid).then(msg2 => {
                                var content = msg2.content;
                                content = content.replace(/\*\*Reason:\*\*.+?\n/, `**Reason:** ${words.join(' ')}\n`);
                                bu.db.query('update modlog set reason = ? where guildid = ? and caseid = ?',
                                    [words.join(' '), msg.channel.guild.id, caseid], err => {
                                        bu.logger.error(err);
                                    });
                                if (!row[0].modid) {
                                    content = content.replace(/\*\*Moderator:\*\*.+/, `**Moderator:** ${msg.author.username}#${msg.author.discriminator}`);
                                    bu.db.query('update modlog set modid = ? where guildid = ? and caseid = ?',
                                        [msg.author.id, msg.channel.guild.id, caseid], err => {
                                            bu.logger.error(err);
                                        });
                                }

                                bot.editMessage(row[0].channelid, row[0].msgid, content);
                                bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
                            });
                        }
                    });
            }
        }
    });
};