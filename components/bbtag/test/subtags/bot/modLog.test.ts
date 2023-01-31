import type { Entities } from '@blargbot/bbtag';
import { Subtag, UserNotFoundError } from '@blargbot/bbtag';
import { ModLogSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ModLogSubtag),
    argCountBounds: { min: 2, max: 5 },
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(user.instance);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user.instance, bbctx.user, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(user1.instance);

                const user2 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '2365432687945234625')).thenResolve(user2.instance);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(user1.instance);

                const user2 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '2365432687945234625')).thenResolve(user2.instance);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(user1.instance);

                const user2 = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '2365432687945234625')).thenResolve(user2.instance);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', 0xff0000)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(user.instance);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user.instance, bbctx.user, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 35, error: new UserNotFoundError('023634983746234834') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, '023634983746234834')).thenResolve(undefined);
            }
        }
    ]
});
