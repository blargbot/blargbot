/*
 * @Author: RagingLink
 * @Date: 2021-08-20 19:09:50
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-08-20 19:15:57
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.SimpleTag('tagauthorizer')
        .withAlias('ccauthorizer')
        .withDesc('Returns the user ID of the tag/cc authorizer')
        .withExample(
            '{username;{tagauthorizer}} authorized this tag!',
            'stupid cat authorized this tag!'
        ).whenDefault((_, context) => context.authorizer)
    .build();
