const fs = require('fs');
let files = fs.readdirSync(__dirname);
let e = {};

for (const file of files) {
    if (file.endsWith('.json'));
    let name = file.split('.')[0];
    e[name.toLowerCase()] = require(`./${file}`);
}

module.exports = e;