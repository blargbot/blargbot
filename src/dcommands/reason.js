const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

class ReasonCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reason',
            category: bu.CommandType.ADMIN,
            usage: 'reason <caseid | latest> <reason>',
            info: 'Sets the reason for an action on the modlog.'
        });
    }

    async execute(msg, words, text) {
        let val = await bu.guildSettings.get(msg.channel.guild.id, 'modlog');
        if (val) {
            if (words.length >= 3) {
                var latest = false;
                if (words[1].toLowerCase() == 'latest' || words[1].toLowerCase() == 'l') {
                    latest = true;
                }
                words.shift();
                var caseid = parseInt(words.shift());
                console.debug(caseid);


                let storedGuild = await bu.getGuild(msg.guild.id);
                let modlog = storedGuild.modlog;
                let index = latest ? modlog.length - 1 : caseid;
                if (modlog.length > 0 && modlog[index]) {
                    let msg2 = await bot.getMessage(val, modlog[index].msgid);

                    var content = msg2.content;
                    content = content.replace(/\*\*Reason:\*\*.+?\n/, `**Reason:** ${words.join(' ')}\n`);
                    modlog[index].reason = words.join(' ');
                    content = content.replace(/\*\*Moderator:\*\*.+/, `**Moderator:** ${msg.author.username}#${msg.author.discriminator}`);
                    modlog[index].modid = msg.author.id;
                    r.table('guild').get(msg.channel.guild.id).update({
                        modlog: modlog
                    }).run();
                    let embed = msg2.embeds[0];
                    if (embed) {
                        embed.fields[1].value = words.join(' ');
                        embed.timestamp = moment(embed.timestamp);
                        embed.footer = {
                            text: `${bu.getFullName(msg.author)} (${msg.author.id})`,
                            icon_url: msg.author.avatarURL
                        };
                        msg2.edit({
                            content: ' ',
                            embeds: [embed]
                        });
                    } else {
                        msg2.edit(content);
                    }
                    bu.send(msg, ':ok_hand:');
                } else {
                    bu.send(msg, 'That case does not exist!');
                }
            }
        }
    }
}

module.exports = ReasonCommand;
