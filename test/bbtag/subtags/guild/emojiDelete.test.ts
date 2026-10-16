import { BBTagRuntimeError } from '@blargbot/bbtag';
import { EmojiDeleteSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new EmojiDeleteSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['emojiDelete'],
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageEmojisAndStickers.toString();
    },
    cases: [
        {
            code: '{emojidelete;234762389364243}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.deleteGuildEmoji(ctx.guild.id, '234762389364243', 'Command User#0000')).resolves(undefined);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Author cannot delete emojis`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot delete emojis') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Failed to delete emoji: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to delete emoji: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup(m => m.deleteGuildEmoji(ctx.guild.id, '234762389364243', 'Command User#0000')).rejects(error);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Failed to delete emoji: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to delete emoji: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup(m => m.deleteGuildEmoji(ctx.guild.id, '234762389364243', 'Command User#0000')).rejects(error);
            }
        }
    ]
});
