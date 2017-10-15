var e = module.exports = {};
const heapdump = require('heapdump');



e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'heapdump [interval (ms)]';
e.info = 'Does heapdumps.';

e.execute = async function (msg, words) {
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
            startTime = dep.moment();
            await bu.send(msg, 'Writing snapshot...');
            heapdump.writeSnapshot(dep.path.join(__dirname, '..', `blargdump${i}.heapsnapshot`), (err, filename) => {
                let diff = dep.moment.duration(dep.moment() - startTime);
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
                        timestamp: dep.moment(dep.moment() + interval),
                        footer: 'Next Dump'
                    }]
                });
                i++;
                if (i == 4) onComplete();
                else setTimeout(doHeapdump, interval);
            });
        }
        doHeapdump();

    }
};