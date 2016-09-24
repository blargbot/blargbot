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
e.usage = 'reason <case> <reason>';
e.info = 'Sets the reason for an action on the modlog.';
e.longinfo = `<p>Sets the reason for an action on the modlog.</p>`;

e.execute = (msg, words) => {
    bu.guildSettings.get(msg.channel.guild.id, 'modlog').then(val => {
        if (val) {
            if (words.length >= 3) {
                //  console.log('whew')
                words.shift();
                var caseid = parseInt(words.shift());
                console.log(caseid);
                bu.db.query(`select msgid, modid, guildsetting.value as channelid from modlog 
        inner join guildsetting 
            on modlog.guildid = guildsetting.guildid and guildsetting.name = "modlog"
        where modlog.guildid = ? and caseid = ?`,
                    [msg.channel.guild.id, caseid], (err, row) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        // console.log('whew2')
                        //   console.log(util.inspect(row))
                        if (row[0]) {
                            //   console.log('whew3')

                            bot.getMessage(row[0].channelid, row[0].msgid).then(msg2 => {
                                //     console.log('whew4')

                                var content = msg2.content;

                                content = content.replace(/\*\*Reason:\*\*.+?\n/, `**Reason:** ${words.join(' ')}\n`);
                                bu.db.query('update modlog set reason = ? where guildid = ? and caseid = ?',
                                    [words.join(' '), msg.channel.guild.id, caseid], err => {
                                        console.log(err);
                                    });
                                if (!row[0].modid) {
                                    content = content.replace(/\*\*Moderator:\*\*.+/, `**Moderator:** ${msg.author.username}#${msg.author.discriminator}`);
                                    bu.db.query('update modlog set modid = ? where guildid = ? and caseid = ?',
                                        [msg.author.id, msg.channel.guild.id, caseid], err => {
                                            console.log(err);
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


    /* if (msg.channel.guild.members.get(bot.user.id).permission.json['banMembers']) {
         if (msg.member.permission.json['banMembers']) {
             if (words[1]) {
                 var user = bu.getUserFromName(msg, words[1])
                 if (!user)
                     return;
 
                 if (!bu.bans[msg.channel.guild.id])
                     bu.bans[msg.channel.guild.id] = {}
                 bu.bans[msg.channel.guild.id][user.id] = msg.author.id
                 var deletedays = 0
                 if (words[2])
                     deletedays = parseInt(words[2])
                 bot.banGuildMember(msg.channel.guild.id, user.id, deletedays)
             }
             //bot.ban
         } else {
             bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to ban users!`)
         }
     } else {
         bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to ban users!`)
     }*/
};