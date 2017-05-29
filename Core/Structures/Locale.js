/**
 * All messages that the bot emits are to be *externalized* so that we can implement locales.
 * These messages are all *functions* taking varying amounts of parameters. This is for
 * dynamic messages and consistency.
 */

class Locale {
    constructor(client, code) {
        this.client = client;
        if (this.constructor === Locale) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.code = code || this.constructor.name;
    }

    resolve(code) {
        let segments = code.split('.');
        let temp;
        while (segments.length > 0) {
            if (temp == undefined)
                temp = this[segments.shift()];
            else temp = temp[segments.shift()];
        }
    }
}