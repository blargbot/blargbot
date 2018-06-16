'use strict';

class CacheEntry {
    get updated() { return JSON.stringify(this.original) != JSON.stringify(this.value); }

    constructor(context, key, original) {
        this.context = context;
        this.key = key;
        this.original = original;
        this.value = original;
    }
}

class VariableCache {
    get list() { return Object.keys(this.cache).map(k => this.cache[k]); }

    constructor(parent) {
        this.parent = parent;
        /** @type {Object.<string, CacheEntry>} */
        this.cache = {};
    }

    /** @param {string} variable The name of the variable to retrieve @returns {string}*/
    async get(variable) {
        let forced = variable.startsWith('!');
        if (forced) variable = variable.substr(1);
        if (forced || this.cache[variable] === undefined) {
            let scope = bu.tagVariableScopes.find(s => variable.startsWith(s.prefix));
            if (scope == null) throw new Error('Missing default variable scope!');
            try {
                this.cache[variable] = new CacheEntry(this.parent, variable,
                    await scope.getter(this.parent, variable.substring(scope.prefix.length)) || '');
            } catch (err) {
                console.error(err, this.parent.isCC, this.parent.tagName);
                throw err;
            }
        }
        return this.cache[variable].value;
    }

    /**
     * @param {string} variable The variable to store
     * @param {string} value The value to set the variable to
     */
    async set(variable, value) {
        if (typeof value === 'object') {
            value = JSON.parse(JSON.stringify(value));
        }

        let forced = variable.startsWith('!');
        if (forced) variable = variable.substr(1);
        if (this.cache[variable] === undefined)
            await this.get(variable);
        this.cache[variable].value = value;
        if (forced)
            await this.persist([variable]);
    }

    async reset(variable) {
        if (this.cache[variable] == null)
            await this.get(variable);
        this.cache[variable].value = this.cache[variable].original;
    }

    async persist(variables = null) {
        let execOngoing = this.parent.execTimer._start !== null;
        if (execOngoing)
            this.parent.execTimer.end();
        this.parent.dbTimer.resume();
        let vars = (variables || Object.keys(this.cache))
            .map(key => this.cache[key])
            .filter(c => c !== undefined);
        let pools = {};
        for (const v of vars) {
            if (v.original !== v.value) {
                let scope = bu.tagVariableScopes.find(s => v.key.startsWith(s.prefix));
                if (scope == null) throw new Error('Missing default variable scope!');
                if (!pools[scope.prefix])
                    pools[scope.prefix] = {};
                pools[scope.prefix][v.key.substring(scope.prefix.length)] = v.value === undefined || v.value === '' ? null : v.value;
                v.original = v.value;
            }
        }
        for (const key in pools) {
            let scope = bu.tagVariableScopes.find(s => key === s.prefix);
            let start = Date.now();
            let objectCount = Object.keys(pools[key]).length;
            console.log('Committing', objectCount, 'objects to the', key, 'pool.');
            await scope.setter(this.parent, pools[key]);
            let diff = Date.now() - start;
            console[diff > 3000 ? 'info' : 'log']('Commited', objectCount, 'objects to the', key, 'pool in', Date.now() - start, 'ms.');
            this.parent.dbObjectsCommitted += objectCount;
        }
        this.parent.dbTimer.end();
        if (execOngoing)
            this.parent.execTimer.resume();
    }
}

module.exports = {
    VariableCache,
    CacheEntry
};