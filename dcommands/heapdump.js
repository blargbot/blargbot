var e = module.exports = {};
const heapdump = require('heapdump');
const path = require('path');
const moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'heapdump [interval (ms)]';
e.info = 'Does heapdumps.';

e.execute = (msg, words) => {
    if (msg.author.id == bu.CAT_ID) {
        let interval = 1800000;
        if (words[1]) interval = parseInt(words[1]);

        bu.send(msg, `I will perform four heapdumps in intervals of ${interval}ms. I will ping you every time a heapdump is completed.`);

        let i = 0;
        let startTime;

        function onComplete() {
            bu.send(msg, `Hey ${msg.author.mention}, I'm done. Thanks for your patience.`);
        }

        function doHeapdump() {
            startTime = moment();
            bu.send(msg, 'Writing snapshot...');
            heapdump.writeSnapshot(path.join(__dirname, `dump${i}.heapsnapshot`), (err, filename) => {
                let diff = moment.duration(moment() - startTime);
                bu.send(msg, {
                    content: `${msg.author.mention} Snapshot ${i + 1} complete.`,
                    embed: {
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
                            value: filename.split('/')[filename.split('/').length - 1],
                            inline: true
                        }]
                    }
                });
                i++;
                if (i == 4) onComplete();
                else setTimeout(doHeapdump, interval);
            });
        }
        doHeapdump();

    }
};