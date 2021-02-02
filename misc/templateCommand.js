/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:34:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:34:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const BaseCommand = require('../src/structures/BaseCommand');
const newbutils = require('../src/newbu')

class AvatarCommand extends BaseCommand {
    constructor() {
        super({
            name: 'command',
            category: newbutils.commandTypes.GENERAL,
            usage: 'command <required> [optional]',
            info: 'some info',
            flags: [{
                flag: 'f',
                word: 'format',
                desc: 'My description'
            }]
        });
    }

    async execute(msg, words, text) {
    }
}

module.exports = AvatarCommand;
