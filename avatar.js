/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:23:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:23:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
const fs = require('fs');
const path = require('path');

var avatars = [];
for (var i = 0; i < 8; i++) {
    avatars.push(getBase64(i));
}

fs.writeFileSync(path.join(__dirname, `avatars2.json`), JSON.stringify(avatars, null, 4));

console.log('done');

function getBase64(iteration) {
    var bitmap = fs.readFileSync(path.join(__dirname, 'img', 'avatars', 'halloween', `sblargbotmed${iteration}.png`));

    return 'data:image/png;base64,' + new Buffer(bitmap).toString('base64');
}