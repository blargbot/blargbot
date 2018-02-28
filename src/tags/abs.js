/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:29
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('abs')
        .withArgs(a => a.require('number'))
        .withDesc('Gets the absolute value of a number')
        .withExample(
            '{abs;-535}',
            '535'
        )
        .beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('<2', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function(params) {
            let asNumber = parseFloat(params.args[1]);
            if (!isNaN(asNumber)) {
                return Math.abs(asNumber);
            } else {
                return await Builder.errors.notANumber(params);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();