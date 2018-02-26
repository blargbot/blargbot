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
    Builder.ComplexTag('abs')
        .withArgs(b =>
            b.require('number')
        ).withDesc('Gets the absolute value of a number')
        .withExample(
            '{abs;-535}',
            '535'
        )
        .beforeExecute(Builder.defaults.processAllSubtags)
        .whenArgs('<2', Builder.defaults.notEnoughArguments)        
        .whenArgs('2', async params => {
            let asNumber = parseFloat(params.args[1]);
            if (!isNaN(asNumber)) {
                return Math.abs(asNumber);
            } else {
                return await bu.tagProcessError(params, '`Not a number`');
            }
        })
        .whenDefault(Builder.defaults.tooManyArguments)
        .build();