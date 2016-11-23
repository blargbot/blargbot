var e = module.exports = {};

var http = require('http');


e.init = () => {
    
    


    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'cat <tags>';
e.info = 'Gets a picture of a cat.';
e.info = '<p>Displays a picture of a cat, taken from <a href="http://random.cat/">random.cat</a></p>';


e.execute = async function(msg) {
    var output;
    http.get('http://random.cat/meow', function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            logger.debug(body);
            output = JSON.parse(body);
            bu.sendFile(msg.channel.id, '', output.file);
        });
    });
};