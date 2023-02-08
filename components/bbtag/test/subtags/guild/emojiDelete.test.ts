import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { EmojiDeleteSubtag } from '@bbtag/blargbot/subtags';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(EmojiDeleteSubtag),
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageEmojisAndStickers.toString();
    },
    cases: [
        {
            code: '{emojidelete;234762389364243}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.deleteEmote(bbctx, '234762389364243')).thenResolve(undefined);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Author cannot delete emojis`',
            errors: [
                { start: 0, end: 29, error: new BBTagRuntimeError('Author cannot delete emojis') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Failed to delete emoji: This is an error`',
            errors: [
                { start: 0, end: 29, error: new BBTagRuntimeError('Failed to delete emoji: This is an error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.guildService.setup(m => m.deleteEmote(bbctx, '234762389364243')).thenResolve({ error: 'This is an error' });
            }
        }
    ]
});
