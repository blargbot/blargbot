import 'chai-exclude';

import { RandomChooseSubtag } from '@blargbot/bbtag/subtags/misc/randomChoose.js';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new RandomChooseSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{randchoose;{eval}5}',
            expected: '5',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ]
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
                expect(errors).to.have.length(2);
                const err1 = errors[0];
                expect(err1.subtag?.start.line).to.equal(0);
                expect(err1.subtag?.end.line).to.equal(0);
                expect(err1.error).to.be.instanceOf(MarkerError);
                const err2 = errors[1];
                expect(err2.subtag?.start.line).to.equal(1);
                expect(err2.subtag?.end.line).to.equal(1);
                expect(err2.error).to.be.instanceOf(MarkerError);
            },
            retries: 5
        }
    ]
});
