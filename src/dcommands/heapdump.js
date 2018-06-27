const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const heapdump = require('heapdump');

class HeapdumpCommand extends BaseCommand {
    constructor() {
        super({
            name: 'heapdump',
            category: bu.CommandType.CAT,
            usage: 'heapdump [interval (ms)]',
            info: 'Does heapdumps.'
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            let interval = 1800000;
            if (words[1]) interval = parseInt(words[1]);

            await bu.send(msg, `I will perform four heapdumps in intervals of ${interval}ms. I will ping you every time a heapdump is completed.`);

            let i = 0;
            let startTime;

            function onComplete() {
                bu.send(msg, `Hey ${msg.author.mention}, I'm done. Thanks for your patience.`);
            }

            async function doHeapdump() {
                startTime = moment();
                await bu.send(msg, 'Writing snapshot...');
                heapdump.writeSnapshot(dep.path.join(__dirname, '..', `blargdump${i}.heapsnapshot`), (err, filename) => {
                    let diff = moment.duration(moment() - startTime);
                    // https://canary.discordapp.com/api/webhooks/368920953356288001/
                    bot.executeWebhook('368920953356288001', config.emerg.heap, {
                        content: `${msg.author.mention} Snapshot ${i + 1} complete.`,
                        embeds: [{
                            fields: [{
                                name: 'Errors',
                                value: err ? err.message : 'None',
                                inline: true
                            }, {
                                name: 'Time',
                                value: `${diff.asSeconds()} seconds`,
                                inline: true
                            }, {
                                name: 'Filename',
                                value: filename,
                                inline: true
                            }],
                            timestamp: moment(moment() + interval),
                            footer: { text: 'Next Dump' }
                        }]
                    });
                    i++;
                    if (i == 4) onComplete();
                    else setTimeout(doHeapdump, interval);
                });
            }
            doHeapdump();

        }
    }
}

module.exports = HeapdumpCommand;
