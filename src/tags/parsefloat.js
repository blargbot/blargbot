/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:41
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('parsefloat')
        .withArgs(a => a.require('text'))
        .withDesc('Returns an floating point number from `text`. If it wasn\'t a number, returns `NaN`.')
        .withExample(
            'bu.parseFloat;abcd} bu.parseFloat;12.34} bu.parseFloat;1.2cd}',
            'NaN 12.34 1.2'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let number = bu.parseFloat(params.args[1]);
            if (isNaN(number))
                return 'NaN';
            return number;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();