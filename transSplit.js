const fs = require('fs');
const path = require('path');
let p = path.join(__dirname, 'Locale');

let files = fs.readdirSync(p);
console.log(files);

for (const file of files) {
    if (file.endsWith('.json')) {
        let name = file.split('.')[0];
        fs.mkdirSync(path.join(p, name));
        const json = require('./Locale/' + file);
        for (const key in json) {
            fs.writeFileSync(path.join(p, name, `${key}.json`), JSON.stringify(json[key], null, 4));
        }
    }
}