/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:30:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-14 11:39:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {
    SC: require('node-soundcloud'),
    emoji: require('node-emoji'),
    //    wordsearch: require('wordsearch'),
    cleverbot: require('cleverbot'),
    cleverbotIo: require('better-cleverbot-io'),
    cleverbotIoIo: require('cleverbot.io'),
    bodyParser: require('body-parser'),
    mkdirp: require('mkdirp'),
    winston: require('winston'),
    wconfig: require('winston/lib/winston/config'),
    Trello: require('node-trello'),
    babel: require('babel-core'),
    brainfuck: new (require('brainfuck-node'))(),
    BigNumber: require('big-number'),
    url: require('url')
};

Object.defineProperty(e.Eris.Message.prototype, "guild", {
    get: function guild() {
        return this.channel.guild;
    }
});

// super important string prototype
Object.defineProperty(String.prototype, 'succ', {
    enumerable: false,
    configurable: false,
    get() {
        let cc = this.charCodeAt(this.length - 1); cc++;
        return this.substring(0, this.length - 1) + String.fromCharCode(cc);
    }
});