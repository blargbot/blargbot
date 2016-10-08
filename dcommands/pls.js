var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = true;
e.usage = 'pls';
e.info = 'Gets messages made by the stupid cat on your guild';

e.execute = (msg) => {
    if (msg.channel.guild.members.get('103347843934212096')) {
        var statement = ` from catchat `;
        statement += ` where nsfw <> 1`;
        bu.db.query(`select count(*) as count` + statement, (err, row) => {
            if (err)
                bu.logger.error(err);
            bu.db.query(`select varvalue as pos from vars where varname = ?`,
                ['markovpos'], (err2, row2) => {
                    if (err2) bu.logger.error(err2);
                    if (!row2[0]) {
                        bu.db.query(`insert into vars (varname, varvalue) values ("markovpos", 0)`);
                        e.bot.createMessage(msg.channel.id, `Markov initiated! Please try again.`);
                    } else {
                        var max = row[0].count;
                        bu.logger.debug(max);
                        if (max >= 100) {
                            var diff = bu.getRandomInt(0, 100) - 50;
                            var pos = parseInt(row2[0].pos) + diff;
                            if (pos < 0) {
                                pos += max;
                            }
                            if (pos > max) {
                                pos -= max;
                            }
                            bu.logger.debug('Getting message at pos', pos);
                            bu.db.query(`select id, content, attachment` + statement + ` limit 1 offset ?`,
                                [pos], (err3, row3) => {
                                    if (err3) bu.logger.error(err3);
                                    if (row3[0]) {
                                        var messageToSend = `${row3[0].content} ${row3[0].attachment == 'none' ? '' :
                                            row3[0].attachment}`;
                                        bu.sendMessageToDiscord(msg.channel.id, `\u200B` + messageToSend);
                                        bu.db.query(`update vars set varvalue = ? where varname="markovpos"`,
                                            [pos]);
                                    }
                                });
                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `I don't have a big enough sample size.`);
                        }

                    }
                });


        });
    }
};