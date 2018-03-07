/*
 * @Author: stupid cat
 * @Date: 2018-02-07 18:30:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-24 15:16:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('tagexists')
        .withArgs(a => a.require('subTag'))
        .withDesc('Checks to see if `subTag` exists.')
        .withExample(
            '{tagexists;ban} {tagexists;AllenKey}',
            'true false'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let tagName = params.args[1];
            return TagManager.list[tagName.toLowerCase()] != null;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();