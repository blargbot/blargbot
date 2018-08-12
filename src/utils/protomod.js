// Perform all prototype modifications here

const { Message, User } = require('eris');

Object.defineProperty(Message.prototype, "guild", {
    get: function guild() {
        return this.channel.guild;
    }
});

Object.defineProperty(User.prototype, "toString", {
    value: function tostring() {
        return this.username + '#' + this.discriminator;
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