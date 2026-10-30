import assert from 'node:assert/strict';

import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { RandomChooseSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new RandomChooseSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['randomChoose', 'randChoose'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{randchoose;{eval}5}',
            expected: '5',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            setup() {
                variables.setup(m => m.get('5')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{randchoose;{eval}~var}',
            expected: /^[0-9]$/,
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            retries: 5,
            setup() {
                variables.setup(m => m.get('~var')).resolves({ key: 'foo', value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }).mustHappen(1);
            }
        },
        {
            code: `{randchoose;{eval}[1,2,3,4,5,6,7,8,9]}
{randchoose;{eval}[1,2,3,4,5,6,7,8,9]}`,
            expected: /^(\d)\n(?!\1)\d$/, // the 2 numbers picked should not be the same
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 51, end: 57, error: new MarkerError('eval', 51) }
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
                assert.equal(err1.subtag?.start.line, 0);
                assert.equal(err1.subtag.end.line, 0);
                assert(err1.error instanceof MarkerError);
                const err2 = errors[1];
                assert.equal(err2.subtag?.start.line, 1);
                assert.equal(err2.subtag.end.line, 1);
                assert(err2.error instanceof MarkerError);
            },
            retries: 5
        }
    ]
});
