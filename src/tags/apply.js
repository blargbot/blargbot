/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-16 11:52:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    new Builder()
    .withCategory(bu.TagType.ARRAY)
    .withName('apply')
    .withArgs(b => 
        b.require('subtag').optional(b => 
            b.addChild('args').allowMultiple(true)
        )
    ).withDesc('Executes the provided subtag, using the `args` as parameters. '+
    'If `args` is an array, it will get deconstructed to it\'s individual elements.'
    ).withExample(
        '{apply;randint;[1,4]}',
        '3'
    ).beforeExecute(Builder.defaults.processAllSubtags)
    .whenArgs('>=2', async params => {
        if (!TagManager.list.hasOwnProperty(params.args[1]))
            return await bu.tagProcessError(params, '`No tag found`');
        let tag = TagManager.list[params.args[1]];
        let tagArgs = [];

        for (const arg of params.args.slice(2)){
            let deserialized = await bu.getArray(params, arg);
            if (deserialized && Array.isArray(deserialized.v))
                tagArgs.push(...deserialized.v);
            else
                tagArgs.push(arg);
        }

        params.args = [params.args[0], ...tagArgs];

        return await tag.execute(params);
    }).whenArgs('<2', Builder.defaults.notEnoughArguments)
    .build();