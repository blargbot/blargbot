import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { ReplaceSubtag } from '@cluster/subtags/misc/replace';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ReplaceSubtag(),
    cases: [
        {
            code: '{replace}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{replace;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{replace;abc;123}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.replace).to.deep.equal({ regex: 'abc', with: '123' });
            }
        },
        { code: '{replace;This is a test;is;aaaa}', expected: 'Thaaaa is a test' },
        {
            code: '{replace;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 30, end: 36, error: new MarkerError('eval', 30) },
                { start: 0, end: 37, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
