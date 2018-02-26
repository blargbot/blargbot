/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ComplexTag('aget')
        .withDepreciated(true)
        .withArgs(b =>
            b.require('name').optional('index')
        ).withDesc('Returns a stored variable, or an index in a stored array. ' +
            'Variables are unique per-author. ' +
            'This tag is functionally equivalent to {get;@name;index}'
        ).withExample(
            '{aget;testvar}',
            'This is a test var'
        ).whenDefault(async params => {
            params.args[1] = '@' + params.args[1];
            return await TagManager.list['get'].execute(params);
        }).build();