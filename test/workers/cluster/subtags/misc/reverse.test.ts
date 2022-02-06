import { ReverseSubtag } from '@cluster/subtags/misc/reverse';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReverseSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{reverse;abcdefg}', expected: 'gfedcba' },
        { code: '{reverse;[10,20,30,40,50,60]}', expected: '[60,50,40,30,20,10]' },
        {
            code: '{reverse;_myArray}',
            expected: '',
            setup(ctx) { ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myArray`] = ['abc', 'def', 'ghi']; },
            async assert(ctx) { expect(await ctx.variables.get('_myArray')).to.deep.equal(['ghi', 'def', 'abc']); }
        }
    ]
});
