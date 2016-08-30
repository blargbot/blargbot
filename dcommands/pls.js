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
    if (msg.channel.guild.members.get('103347843934212096')) {
        var statement = ` from catchat `
        statement += ` where nsfw <> 1`
        bu.db.query(`select count(*) as count` + statement, (err, row) => {
            if (err)
                console.log(err);
            bu.db.query(`select varvalue as pos from vars where varname = ?`,
                ['markovpos'], (err2, row2) => {
                    if (err2) console.log(err2)
                    if (!row2[0]) {
                        bu.db.query(`insert into vars (varname, varvalue) values ("markovpos", 0)`)
                        e.bot.createMessage(msg.channel.id, `Markov initiated! Please try again.`)
                    } else {

                        var max = row[0].count;
                        console.log(max)
                        if (max >= 100) {
                            var diff = bu.getRandomInt(0, 100) - 50
                            var pos = parseInt(row2[0].pos) + diff
                            if (pos < 0) {
                                pos += max
                            }
                            if (pos > max) {
                                pos -= max
                            }
                            console.log('Getting message at pos', pos)
                            bu.db.query(`select id, content, attachment` + statement + ` limit 1 offset ?`,
                                [pos], (err3, row3) => {
                                    if (err3) console.log(err3)
                                    if (row3[0]) {
                                        var messageToSend = `${row3[0].content} ${row3[0].attachment == 'none' ? '' :
                                            row3[0].attachment}`;
                                        bu.sendMessageToDiscord(msg.channel.id, `\u200B` + messageToSend);
                                        bu.db.query(`update vars set varvalue = ? where varname="markovpos"`,
                                            [pos])
                                    }
                                })
                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `I don't have a big enough sample size.`);
                        }

                    }
                })


        })
    }
}