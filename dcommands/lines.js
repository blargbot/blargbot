var e = module.exports = {};

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = true;
e.usage = 'lines';
e.info = 'Gets the number of lines the bot is made of.';
e.longinfo = `<p>Gets the number of lines the bot is made of.</p>`;

e.execute = (msg) => {
    var fileArray = fs.readdirSync(path.join(__dirname, '..'));
    var files = [];
    for (var i = 0; i < fileArray.length; i++) {
        if (fileArray[i].endsWith('.js')) {
            files.push(path.join(__dirname, '..', fileArray[i]));
        }
    }
    fileArray = fs.readdirSync(path.join(__dirname));
    for (i = 0; i < fileArray.length; i++) {
        if (fileArray[i].endsWith('.js')) {
            files.push(path.join(__dirname, fileArray[i]));
        }
    }
    //   var lineCount = 0
    function onComplete(lines) {
        bu.send(msg, 'I am made of ' + lines + ' lines.');
    }
    var count = files.length;
    var lines = 0;
    function addLines(err, res) {
        lines += parseInt(res.split(' ')[0]);
        count--;
        if (count == 0) {
            onComplete(lines);
        }
    }
    for (i = 0; i < files.length; i++) {
        exec(`wc -l ${files[i]}`, addLines);
    }
};
