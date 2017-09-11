const choices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
const BaseHelper = require('./BaseHelper');
const crypto = require('crypto');

class RandomHelper extends BaseHelper {
    constructor(client) {
        super(client);
    }

    generateToken(length) {
        if (!length) length = 7;
        let output = '';
        for (let i = 0; i < length; i++) {
            output += choices[this.randInt(0, choices.length - 1)];
        }
        return output;
    }

    randBytes(size = 4) {
        return crypto.randomBytes(size);
    }

    rawRandInt(size = 4) {
        let bytes = this.randBytes(size);
        return bytes.readUIntBE(0, bytes.length);
    }

    randInt(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return (this.rawRandInt() % (1 + max - min)) + min;
    }

    chance(threshold, bounds) {
        let seed = this.randInt(1, bounds);
        return seed <= threshold;
    }

    chancePool(choices = [], chances = []) {
        if (choices.length !== chances.length) throw new Error('Choices must be the same length as chances');
        let total = chances.reduce((a, b) => a + b, 0);
        if (total !== 100) throw new Error('Chances must add up to 100');
        let seed = this.randInt(0, 10000) / 100;
        for (let i = 0; i < chances.length; i++) {
            let accu = chances.slice(0, i + 1).reduce((a, b) => a + b, 0);
            if (seed <= accu)
                return choices[i];
        }
        return choices[choices.length - 1];
    }

    shuffle(array) {
        for (let i = array.length - 1, j = 0, temp = null; i > 0; i--) {
            j = this.randInt(i);
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

module.exports = RandomHelper;