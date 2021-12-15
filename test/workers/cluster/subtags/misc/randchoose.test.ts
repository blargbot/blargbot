import 'chai-exclude';

import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { RandChooseSubtag } from '@cluster/subtags/misc/randchoose';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RandChooseSubtag(),
    cases: [
        {
            code: '{randchoose}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
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
