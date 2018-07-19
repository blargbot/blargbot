'use strict';

class ScopeCollection {
    constructor() {
        /** @type {StateScope[]} */
        this._scopes = [{}];
    }

    get local() { return this._scopes[this._scopes.length - 1]; };
    get(offset) { return this._scopes[this._scopes.length - 1 - offset]; }

    beginScope() {
        this._scopes.push(Object.assign({}, this.local));
    }

    finishScope() {
        this._scopes.pop();
    }
}

module.exports = ScopeCollection;