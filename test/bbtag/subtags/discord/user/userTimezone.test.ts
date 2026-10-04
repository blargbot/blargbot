import type { DiscordUserTimezoneLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userTimezoneReplacer,
    names: ['userTimeZone'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserTimezoneLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimezone', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'UTC',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getUserTimezone(userId)).resolves(null).mustHappen(1);
                    }
                },
                {
                    expected: 'abc',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getUserTimezone(userId)).resolves('abc').mustHappen(1);
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getUserTimezone(userId)).resolves('Etc/UTC').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
