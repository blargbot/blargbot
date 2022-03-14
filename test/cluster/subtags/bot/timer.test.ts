import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { TimerSubtag } from '@blargbot/cluster/subtags/bot/timer';
import { expect } from 'chai';
import moment from 'moment';

import { argument } from '../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TimerSubtag(),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{timer;abc{fail};10s}',
            retries: 3,
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.serialize()).thenReturn({ rules: {}, type: 'tagLimit' });
                ctx.timeouts.setup(m => m.insert('tag', argument.isDeepEqual({
                    version: 4,
                    source: ctx.guild.id,
                    channel: ctx.channels.command.id,
                    endtime: argument.assert<number>(v => expect(v).to.be.closeTo(moment().add(10, 's').valueOf(), 100)).value,
                    context: bbctx.serialize(),
                    content: 'abc{fail}'
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{timer;{fail};test}',
            expected: '`Invalid duration`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid duration') }
            ]
        }
    ]
});
