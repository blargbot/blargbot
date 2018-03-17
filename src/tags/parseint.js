/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:51
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('parseInt')
        .withArgs(a => a.require('text'))
        .withDesc('Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.')
        .withExample(
            'bu.parseInt;abcd} bu.parseInt;1234} bu.parseInt;12cd}',
            'NaN 1234 12'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let number = bu.parseInt(params.args[1]);
            if (isNaN(number))
                return 'NaN';
            return number;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();