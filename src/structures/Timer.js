const moment = require('moment');

class Timer {
    constructor() {
        this._elapsed = 0;
        this._start = null;
    }

    get elapsed() {
        if (this._start === null)
            return this._elapsed;
        else
            return this._elapsed + (Date.now() - this._start);
    }

    get duration() {
        return moment.duration(this.elapsed, 'milliseconds');
    }

    format() {
        let diff = this.duration;
        return `${diff.minutes()} minutes, ${diff.seconds()} seconds, and ${diff.milliseconds()} milliseconds`;
    }

    start(reset = true) {
        if (this._start !== null)
            throw new Error('Cannot start an already started timer');
        if (reset)
            this._elapsed = 0;
        this._start = Date.now();
        return this;
    }

    poll(reset = false) {
        let elapsed = this.elapsed;
        if (reset) {
            this.end();
            this.start();
        }
        return elapsed;
    }

    resume() {
        return this.start(false);
    }

    end() {
        if (this._start !== null) {
            this._elapsed += Date.now() - this._start;
            this._start = null;
        }
        return this;
    }
}

module.exports = Timer;