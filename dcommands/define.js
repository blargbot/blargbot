var e = module.exports = {};




e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'define <word>';
e.info = 'Gets the definition for the specified word. The word must be in english.';
e.longinfo = `<p>Gets the definition for the specified word. The word must be in english.</p>`;

var part = {
    verb: 'v',
    noun: 'n',
    adjective: 'a',
    pronoun: 'p'
};

e.execute = async function(msg, words) {
    words.shift();
    var args = words.join(' ');
    let vars = await r.table('vars').get('wordapis');
    if (!vars)
        vars = {
            day: dep.moment().format('D'),
            uses: 0
        };

    if (vars.day != dep.moment().format('D')) {
        vars.day = dep.moment().format('D');
        vars.uses = 0;
    }
    var max = config.general.isbeta ? 250 : 1500;
    if (vars.uses > max) {
        bu.send(msg, 'I have used up all of my api queries for today. Sorry!');
        return;
    }
    vars.uses++;
    await r.table('vars').get('wordapis').update(vars);
    dep.request({
        url: `https://wordsapiv1.p.mashape.com/words/${args}`,
        headers: {
            'X-Mashape-Key': config.general.mashape,
            'Accept': 'application/json'
        }
    }, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            var message = `Definitions for ${args}:\n`;
            if (res.results) {
                message += `\`\`\`xl\n`;

                for (let i = 0; i < res.results.length; i++) {
                    var type = res.results[i].partOfSpeech;
                    message += `${res.results.length >= 10 ? (i + 1 < 10 ? ` ${i + 1}` : i + 1) : i + 1}: (${part[type] ? part[type] : type}) ${res.results[i].definition}\n`;
                }
                message += `\`\`\``;
            } else {
                message += 'No results found!';
            }
            bu.send(msg, message);
        } else {
            bu.send(msg, 'No results found!');

        }
    });
};