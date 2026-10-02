import type { GuildMemberWarningLocals } from '@blargbot/bbtag-engine';
import { NotANumberError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.warnReplacer,
    names: ['warn'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{warn}',
            expected: '0',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 1, 'Tag Warning')).resolves(0).mustHappen(1);
            }
        },
        {
            code: '{warn}',
            expected: '5',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 1, 'Tag Warning')).resolves(5).mustHappen(1);
            }
        },
        {
            code: '{warn;}',
            expected: '3',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 1, 'Tag Warning')).resolves(3).mustHappen(1);
            }
        },
        {
            code: '{warn;other user}',
            expected: '7',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 1, 'Tag Warning')).resolves(7).mustHappen(1);
            }
        },
        {
            code: '{warn;;6}',
            expected: '26',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 6, 'Tag Warning')).resolves(26).mustHappen(1);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '0',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 9, 'Tag Warning')).resolves(0).mustHappen(1);
            }
        },
        {
            code: '{warn;other user;8;Because I felt like it}',
            expected: '6',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.add(userId, 8, 'Because I felt like it')).resolves(6).mustHappen(1);
            }
        },
        {
            code: '{warn;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 19, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ throw: UserNotFoundError }))).rejects(new UserNotFoundError('unknown user')).mustHappen(1);
            }
        },
        {
            code: '{warn;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 21, error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
            }
        }
    ]
});
