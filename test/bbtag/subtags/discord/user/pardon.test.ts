import type { GuildMemberWarningLocals } from '@blargbot/bbtag-engine';
import { NotANumberError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.pardonReplacer,
    names: ['pardon'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 1, 'Tag Pardon')).resolves(0).mustHappen(1);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 1, 'Tag Pardon')).resolves(5).mustHappen(1);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 1, 'Tag Pardon')).resolves(3).mustHappen(1);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 1, 'Tag Pardon')).resolves(7).mustHappen(1);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 6, 'Tag Pardon')).resolves(26).mustHappen(1);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 9, 'Tag Pardon')).resolves(0).mustHappen(1);
            }
        },
        {
            code: '{pardon;other user;8;Because I felt like it}',
            expected: '6',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                warnings.setup(m => m.remove(userId, 8, 'Because I felt like it')).resolves(6).mustHappen(1);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ throw: UserNotFoundError }))).rejects(new UserNotFoundError('unknown user')).mustHappen(1);
            }
        },
        {
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                const userId = randomSnowflake('userId');
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
            }
        }
    ]
});
