import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { ReverseSubtag } from '@blargbot/bbtag/subtags/misc/reverse';
import { TagVariableType } from '@blargbot/domain/models/index';
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
            expected: 'yarrAym_',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myArray' }, ['abc', 'def', 'ghi']);
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myArray' })).to.deep.equal(['abc', 'def', 'ghi']);
            }
        },
        {
            code: '{reverse;{get;_myArray}}',
            expected: '',
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myArray' }, ['abc', 'def', 'ghi']);
            },
            assert(_, __, ctx) {
                expect(ctx.tagVariables.get({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myArray' })).to.deep.equal(['ghi', 'def', 'abc']);
            }
        }
    ]
});
