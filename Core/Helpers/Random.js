const choices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

function generateToken (length) {
    if (!length) length = 7;
    let output = '';
    for (let i = 0; i < length; i++) {
        output += choices[getRandomInt(0, choices.length - 1)];
    }
    return output;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    generateToken,
    getRandomInt
}