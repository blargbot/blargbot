/*
 * @Author: RagingLink
 * @Date: 2021-08-20 19:09:50
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-08-20 19:15:53
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.SimpleTag('tagauthor')
        .withAlias('ccauthor')
        .withDesc('Returns the user ID of the tag/cc author')
        .withExample(
            'This tag was created by {username;{tagauthor}}',
            'This tag was created by stupid cat'
        ).whenDefault((_, context) => context.author)
    .build();
