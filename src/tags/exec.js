/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ComplexTag('exec')
        .withArgs(a => [a.require('code'), a.optional('arguments')])
        .withDesc('Executes another tag. Useful for modules.')
        .withExample(
            'Let me do a tag for you. {exec;f}',
            'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let tag = await r.table('tag').get(params.args[1]).run();
            return await this.execTag(params, tag);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('execTag', async function (params, tag) {
            if (params.msg.iterations >= 200) {
                bu.send(params.msg, 'Terminated recursive tag after 200 execs.');
                throw ('Too Much Exec');
            }
            params.msg.iterations = (params.msg.iterations + 1) || 1;

            if (!tag)
                return await Builder.util.error('Tag not found');

            if (typeof tag == 'string')
                tag = { content: tag };
            if (tag.content.toLowerCase().indexOf('{nsfw}') > -1 &&
                await bu.isNsfwChannel(params.msg.channel.id))
                return await Builder.util.error(params, 'NSFW tag');

            params.words = bu.splitInput(params.args[2] || '');
            params.content = tag.content;
            return await bu.processTagInner(params);
        }).build();