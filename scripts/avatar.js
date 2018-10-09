const fs = require('fs');
const path = require('path');

let arr = [];
for (let i = 0; i < 8; i++) {
    let r = fs.readFileSync(path.join(__dirname, 'input', 'blaghall' + i + '.png'), { encoding: null });
    arr.push('data:image/png;base64,' + r.toString('base64'));
}

fs.writeFileSync(path.join(__dirname, '..', 'res', 'avatars.json'), JSON.stringify(arr, null, 4), { encoding: 'utf8' });