/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-30 12:46:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('pad')
        .isDepreciated('{pad} will be replaced by {realpad} in v2')
        .withArgs(a => [a.require('direction'), a.require('back'), a.require('text')])
        .withDesc('Pads `back` to the `direction` of `text`. Direction can be `left` or `right`')
        .withExample(
            '{pad;left;000000;ABC}',
            '000ABC'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-3', Builder.errors.notEnoughArguments)
        .whenArgs('4', async function (params) {
            let direction = params.args[1],
                backing = params.args[2],
                overlay = params.args[3];

            if (direction.toLowerCase() == 'left')
                return backing.substr(0, backing.length - overlay.length) + overlay;
            if (direction.toLowerCase() == 'right')
                return overlay + backing.substr(overlay.length);
            return await Builder.util.error(params, 'Invalid drection');
         })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();