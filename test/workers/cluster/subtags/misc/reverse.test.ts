import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ReverseSubtag } from '@cluster/subtags/misc/reverse';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReverseSubtag(),
    cases: [
        {
            code: '{reverse}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{reverse;abcdefg}', expected: 'gfedcba' },
        { code: '{reverse;[10,20,30,40,50,60]}', expected: '[60,50,40,30,20,10]' },
        {
            code: '{reverse;_myArray}',
            expected: '',
            setup(ctx) { ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myArray`] = ['abc', 'def', 'ghi']; },
            async assert(ctx) { expect(await ctx.variables.get('_myArray')).to.deep.equal(['ghi', 'def', 'abc']); }
        },
        {
            code: '{reverse;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 23, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
