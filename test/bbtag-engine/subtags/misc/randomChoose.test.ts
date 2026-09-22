import assert from 'node:assert/strict';

import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.randomChooseReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{randchoose;{eval}5}',
            expected: '5',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('5')).resolves({ key: '5', value: undefined }).mustHappen();
            }
        },
        {
            code: '{randchoose;{eval}~var}',
            expected: /^(a|b|c)$/,
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('~var')).resolves({ key: '~var', value: ['a', 'b', 'c'] }).mustHappen();
            }
        },
        {
            code: `{randchoose;{eval}[1,2,3,4,5,6,7,8,9]}
{randchoose;{eval}[1,2,3,4,5,6,7,8,9]}`,
            expected: /^(\d)\n(?!\1)\d$/, // the 2 numbers picked should not be the same
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: '51:1:12', end: '57:1:18', error: new MarkerError('eval', 51) }
            ],
            retries: 5
        },
        {
            code: '{randchoose;{eval}[1]}',
            expected: '1',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ]
        },
        {
            code: '{randchoose;{eval}[]}',
            expected: '',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ]
        },
        {
            code: `{randchoose;{eval}1;{eval}2;{eval}3;{eval}4;{eval}5;{eval}6;{eval}7;{eval}8;{eval}9}
{randchoose;{eval}1;{eval}2;{eval}3;{eval}4;{eval}5;{eval}6;{eval}7;{eval}8;{eval}9}`,
            expected: /^(\d)\n(?!\1)\d$/, // the 2 numbers picked should not be the same
            errors(errors) {
                assert.equal(errors.length, 2);
                const err1 = errors[0];
                assert.equal(err1.bbtag.start.line, 0);
                assert.equal(err1.bbtag.end.line, 0);
                assert(err1.error instanceof MarkerError);
                const err2 = errors[1];
                assert.equal(err2.bbtag.start.line, 1);
                assert.equal(err2.bbtag.end.line, 1);
                assert(err2.error instanceof MarkerError);
            },
            retries: 5
        }
    ]
});
