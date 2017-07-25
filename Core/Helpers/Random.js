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
        let arr = [];
        arr.length = size;
        let buf = Buffer.from(arr);
        crypto.randomFillSync(buf, 0, size);
        return buf;
    }

    rawRandInt(size = 4) {
        let bytes = this.randBytes(size);
        return bytes.readUIntBE(0, bytes.length);
    }

    randInt(min, max) {
        return (this.rawRandInt() % (++max - min)) + min;
    }

    chance(threshold, bounds) {
        let seed = this.randInt(1, bounds);
        return seed <= threshold;
    }

    shuffle(array) {
        let i = 0,
            j = 0,
            temp = null;

        for (i = array.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

module.exports = RandomHelper;