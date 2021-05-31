// Perform all prototype modifications here

const { Message, User, RequestHandler } = require('eris');

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

RequestHandler.prototype._request = RequestHandler.prototype.request;
RequestHandler.prototype.request = function (...args) {
    if (global.bu && bu.Metrics) {
        try {
            let url;
            if (args[1].includes('webhook')) {
                url = '/webhooks';
            } else {
                url = args[1].replace(/reactions\/.+(\/|$)/g, 'reactions/_reaction/').replace(/\d+/g, '_id');
            }
            bu.Metrics.httpsRequests.labels(args[0], url).inc();
        } catch (err) {
            console.error(err);
        }
    }
    return this._request(...args);
};

// super important string prototype
Object.defineProperty(String.prototype, 'succ', {
    enumerable: false,
    configurable: false,
    get() {
        let cc = this.charCodeAt(this.length - 1); cc++;
        return this.substring(0, this.length - 1) + String.fromCharCode(cc);
    }
});