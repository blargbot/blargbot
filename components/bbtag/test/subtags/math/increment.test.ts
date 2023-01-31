import { NotABooleanError, NotANumberError, Subtag } from '@blargbot/bbtag';
import { IncrementSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(IncrementSubtag),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 18.9999);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, '18');
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(19);
            }
        },
        {
            code: '{increment;_myVariable}',
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
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;3.6}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 22);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;xyz}',
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
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9.6;true}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25);
            }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25.1',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16.1);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25.1);
            }
        },
        {
            code: '{increment;_myVariable;9.6;false}',
            expected: '25.6',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 16);
            },
            assert(_, __, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' })).to.equal(25.6);
            }
        },
        {
            code: '{increment;_myVariable;;abc}',
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
