var e = module.exports = {};

var http = require('http');


e.init = () => {
    
    


    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'econ <from> <to> <amount>';
e.info = 'Converts currency using recent rates.';
e.longinfo = `<p>Converts currency using recent rates.
        Example:</p>

<pre><code>User&gt; blargbot econ USD CAD 1
blargbot&gt; @User, 1.0 USD is equivalent to X.X CAD
</code></pre>

    <p>Currency codes are not case sensitive.</p>`;

e.execute = (msg, words) => {
    if (words.length < 4) {
        bu.send(msg, 'Incorrect usage!\n`econ \<from> \<to> \<amount>`');
        return;
    }
    var to = words[2].toUpperCase();
    var from = words[1].toUpperCase();
    var convert = words[3];

    var url = `http://api.fixer.io/latest?symbols=${to}&base=${from}`;

    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            var rates = JSON.parse(body);
            if (rates.error != null && rates.error === 'Invalid base') {
                bu.send(msg, `Invalid currency ${from}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            if (rates.rates[to] == null) {
                bu.send(msg, `Invalid currency ${to}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            var converted = Math.round((convert * rates.rates[to]) * 100.0) / 100;
            var message = `${convert} ${from} is equivalent to ${converted} ${to}`;
            bu.send(msg, message);

        });
    });
};