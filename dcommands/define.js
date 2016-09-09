var e = module.exports = {};
var bu = require('./../util.js');
var request = require('request');
var moment = require('moment');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'define <word>';
e.info = 'Gets the definition for the specified word (english).';
e.category = bu.CommandType.GENERAL;

var part = {
    verb: 'v',
    noun: 'n',
    adjective: 'a',
    pronoun: 'p'
};

e.execute = (msg, words) => {
    words.shift();
    var args = words.join(' ');
    var config = bu.config;
    if (!config.general.wordapis)
        config.general.wordapis = {
            day: moment().format('D'),
            uses: 0
        };

    if (config.general.wordapis.day != moment().format('D')) {
        config.general.wordapis.day = moment().format('D');
        config.general.wordapis.uses = 0;
    }
    var max = config.general.isbeta ? 250 : 1500;
    if (config.general.wordapis.uses > max) {
        bu.sendMessageToDiscord(msg.channel.id, 'I have used up all of my api queries for today. Sorry!');
        return;
    }
    config.general.wordapis.uses++;
    bu.saveConfig();
    console.log('whew');
    request({
        url: `https://wordsapiv1.p.mashape.com/words/${args}`,
        headers: {
            'X-Mashape-Key': bu.config.general.mashape,
            'Accept': 'application/json'
        }
    }, function (error, response, body) {
        
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            var message = `Definitions for ${args}:\n`;
            if (res.results) {
                message += `\`\`\`xl\n`;

                for (i = 0; i < res.results.length; i++) {
                    var type = res.results[i].partOfSpeech;
                    message += `${res.results.length >= 10 ? (i + 1 < 10 ? ` ${i+1}` : i+1) : i+1}: (${part[type] ? part[type] : type}) ${res.results[i].definition}\n`;
                }
                message += `\`\`\``;
                
                //message.edit("```xl\nDefinitions for " + args + ":\n" + final + "\n```");
            } else {
                message += 'No results found!';
            }
            bu.sendMessageToDiscord(msg.channel.id, message);
        } else {
            bu.sendMessageToDiscord(msg.channel.id, 'No results found!');
            
        }
    });
    //  var url = `http://www.google.com/dictionary/json?callback=a&sl=en&tl=en&q=${words}`
    //  request(url, (err, response, body) => {
    //      console.log(body, util.inspect(body.match(/a\((.+)\)/)))
    //     var definitions = JSON.parse(body.match(/a\((.+)\)/)[0])
    //      console.log(definitions)
    //  })
    /*
    request.post("http://services.aonaware.com/DictService/DictService.asmx/Define", {
        form: {
            word: args
        }
    }, (err, response, body) => {
        if (err) console.log(err)
        xml2js.parseString(body, (err, res) => {
            //console.log(util.inspect(res))
            //console.log(util.inspect(res['WordDefinition']['Definitions']))
            var word = res['WordDefinition'].Word
            var defs = res['WordDefinition'].Definitions[0].Definition
            var message = `Here's the definition${defs.length > 1 ? 's' : ''} for ${word}:\n\`\`\`xl\n`
            console.log(util.inspect(defs, false, null))
            var ii = 1

            for (var i = 0; i < defs.length; i++) {
                //   console.log(util.inspect(defs[i], false, null))
                //   console.log(defs[i]['WordDefinition'])
                //  console.log(defs[i]['Word'])
                console.log(defs[i].Dictionary[0].Id[0])
                if (defs[i].Dictionary[0].Id[0] == 'wn') {
                    var line = `${ii}. ${defs[i]['WordDefinition']}\n`
                    var oddApo = (line.match(/"/g) || []).length % 2
                    message += oddApo == 0 ? line : line.replace(/"/, '\u2019')
                    ii++
                }
            }
            message += `\`\`\``
            bu.sendMessageToDiscord(msg.channel.id, message)

        })

        //console.log(err, response, body)
        // })
    })
    /*
    request.post({
        "url": "http://services.aonaware.com/DictService/DictService.asmx/Define",
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "content-length": args.length
        },
        body: {
            "word": args
        }
    }, (err, response, body) => {
        console.log(err, response, body)
    })
    */

};