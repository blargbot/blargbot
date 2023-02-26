import { NotABooleanError, NotANumberError, Subtag } from '@bbtag/blargbot';
import { DecrementSubtag } from '@bbtag/blargbot/subtags';
import { TagVariableType } from '@bbtag/blargbot'
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(DecrementSubtag),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{decrement;_myVariable}',
            expected: '17',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(17);
            }
        },
        {
            code: '{decrement;_myVariable}',
            expected: '17',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(17);
            }
        },
        {
            code: '{decrement;_myVariable}',
            expected: '17',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18.9999);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(17);
            }
        },
        {
            code: '{decrement;_myVariable}',
            expected: '17',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, '18');
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(17);
            }
        },
        {
            code: '{decrement;_myVariable}',
            expected: '`Not a number`',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 'abc');
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{decrement;_myVariable;3}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{decrement;_myVariable;3}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{decrement;_myVariable;3.6}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{decrement;_myVariable;xyz}',
            expected: '`Not a number`',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 27, error: new NotANumberError('xyz') }
            ]
        },
        {
            code: '{decrement;_myVariable;9;true}',
            expected: '7',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(7);
            }
        },
        {
            code: '{decrement;_myVariable;9;true}',
            expected: '7',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(7);
            }
        },
        {
            code: '{decrement;_myVariable;9.6;true}',
            expected: '7',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(7);
            }
        },
        {
            code: '{decrement;_myVariable;9;false}',
            expected: '7',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(7);
            }
        },
        {
            code: '{decrement;_myVariable;9;false}',
            expected: '7.100000000000001',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(7.100000000000001);
            }
        },
        {
            code: '{decrement;_myVariable;9.6;false}',
            expected: '6.4',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(6.4);
            }
        },
        {
            code: '{decrement;_myVariable;;abc}',
            expected: '`Not a boolean`',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
                Object.freeze(ctx.tagVariables);
            },
            errors: [
                { start: 0, end: 28, error: new NotABooleanError('abc') }
            ]
        }
    ]
});
