'use strict';

/**
 * A tool to navigate a string. Used to communicate between scopes
 * @prop {number} current The current cursor position. This is always between characters, or at the start/end of the string
 * @prop {string} content The text that this iterator is for
 */
class StringIterator {
    /** Gets the character after the current cursor position */
    get nextChar() { return this.content.slice(this.current, this.current + 1); }
    /** Gets the character before the current cursor position */
    get prevChar() { return this.content.slice(Math.max(0, this.current - 1), this.current); }

    constructor(text) {
        this.content = text;
        this.current = 0;
    }

    /** Attempts to move the cursor 1 place forwards. If successful, it returns `true`, otherwise `false` */
    moveNext() {
        if (this.current != this.content.length) {
            this.current += 1;
            return true;
        }
        return false;
    }

    /** Attempts to move the cursor 1 place backwards. If successful, it returns `true`, otherwise `false` */
    moveBack() {
        if (this.current != 0) {
            this.current -= 1;
            return true;
        }
        return false;
    }
}

module.exports = StringIterator;