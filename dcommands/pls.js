var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = true
e.usage = 'pls';
e.info = 'Gets messages made by the stupid cat on your guild';
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    var statement = ` from catchat `
//where guildid = ?
 //   if (!(bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].nsfw && bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id]))
        statement += ` where nsfw <> 1`

    // statement += ` order by RANDOM()`
    var stmt = bu.db.prepare(`select count(*) as count` + statement);
    stmt.get((err, row) => {
        if (err)
            console.log(err);
        stmt = bu.db.prepare(`select varvalue as pos from vars where varname = ?`)
        stmt.get('markovpos', (err2, row2) => {
            if (err2) console.log(err2)
            if (!row2) {
                stmt = bu.db.prepare(`insert into vars (varname, varvalue) values ("markovpos", 0)`)
                stmt.run()
                bu.sendMessageToDiscord(msg.channel.id, `Markov initiated! Please try again.`)
            } else {

                var max = row.count;

                if (max >= 100) {
                    var diff = bu.getRandomInt(0, 100) - 50
                    var pos = parseInt(row2.pos) + diff
                    if (pos < 0) {
                        pos += max
                    }
                    if (pos > max) {
                        pos -= max
                    }
                    console.log('Getting message at pos', pos)
                    stmt = bu.db.prepare(`select id, content, attachment` + statement + ` limit 1 offset ?`)
                    stmt.get(pos, (err3, row3) => {
                        if (err3) console.log(err3)
                        if (row3) {
                            var messageToSend = `${row3.content} ${row3.attachment == 'none' ? '' : row3.attachment}`;
                            bu.sendMessageToDiscord(msg.channel.id, `\u200B` + messageToSend);

                            stmt = bu.db.prepare(`update vars set varvalue = ? where varname="markovpos"`)
                            stmt.run(pos)
                        }
                    })

                } else {
                    bu.sendMessageToDiscord(msg.channel.id, `I don't have a big enough sample size.`);
                }

            }
        })


    })
}