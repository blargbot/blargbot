import { NotABooleanError, NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { IncrementSubtag } from '@blargbot/cluster/subtags/math/increment';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IncrementSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 18;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 18.1;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 18.9999;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = '18';
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '`Not a number`',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 'abc';
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 22;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 22.1;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;3.6}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 22;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;xyz}',
            expected: '`Not a number`',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 22;
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 27, error: new NotANumberError('xyz') }
            ]
        },
        {
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16.1;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9.6;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25.1',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16.1;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25.1);
            }
        },
        {
            code: '{increment;_myVariable;9.6;false}',
            expected: '25.6',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 16;
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`]).to.equal(25.6);
            }
        },
        {
            code: '{increment;_myVariable;;abc}',
            expected: '`Not a boolean`',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 22;
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 28, error: new NotABooleanError('abc') }
            ]
        }
    ]
});
