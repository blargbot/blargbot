import moment from 'moment';

export class Timer {
    #elapsed: number;
    #start: number | null;

    constructor() {
        this.#elapsed = 0;
        this.#start = null;
    }

    get elapsed() {
        if (this.#start === null)
            return this.#elapsed;
        else
            return this.#elapsed + (Date.now() - this.#start);
    }

    get duration() {
        return moment.duration(this.elapsed, 'milliseconds');
    }

    format() {
        let diff = this.duration;
        return `${diff.minutes()} minutes, ${diff.seconds()} seconds, and ${diff.milliseconds()} milliseconds`;
    }

    start(reset = true) {
        if (this.#start !== null)
            throw new Error('Cannot start an already started timer');
        if (reset)
            this.#elapsed = 0;
        this.#start = Date.now();
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
        if (this.#start !== null) {
            this.#elapsed += Date.now() - this.#start;
            this.#start = null;
        }
        return this;
    }
}

module.exports = Timer;