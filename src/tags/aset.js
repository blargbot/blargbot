/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:50
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:26:50
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ComplexTag('aset')
        .withDepreciated(true)
        .withArgs(b =>
            b.require('name').optional(b =>
                b.addChild('value').allowMultiple(true)
            )
        ).withDesc('Stores a variable. ' +
            'Variables are unique per-author. ' +
            'This tag is functionally equivalent to {set;@name;value}'
        ).withExample(
            '{aset;testvar;This is a test var}',
            ''
        ).whenArgs('1', Builder.errors.notEnoughArguments)
        .whenDefault(async params => {
            params.args[1] = '@' + params.args[1];
            return await TagManager.list['set'].execute(params)
        })
        .build();