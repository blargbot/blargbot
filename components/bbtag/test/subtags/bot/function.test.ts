import type { Statement } from '@blargbot/bbtag';
import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { FunctionSubtag } from '@blargbot/bbtag/subtags/bot/function.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FunctionSubtag),
    argCountBounds: { min: { count: 2, noEval: [1] }, max: { count: 2, noEval: [1] } },
    cases: [
        {
            code: '{function;test;{fail}}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.root.functions['test']).to.deep.equal(<Statement>{
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 16, line: 0, index: 16 },
                                end: { column: 20, line: 0, index: 20 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 15, line: 0, index: 15 },
                            end: { column: 21, line: 0, index: 21 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 15, line: 0, index: 15 },
                    end: { column: 21, line: 0, index: 21 }
                });
            }
        },
        {
            code: '{function;func.test;{fail}}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.root.functions['test']).to.deep.equal(<Statement>{
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 21, line: 0, index: 21 },
                                end: { column: 25, line: 0, index: 25 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 20, line: 0, index: 20 },
                            end: { column: 26, line: 0, index: 26 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 20, line: 0, index: 20 },
                    end: { column: 26, line: 0, index: 26 }
                });
            }
        },
        {
            code: '{function;func.;{fail}}',
            expected: '`Must provide a name`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Must provide a name') }
            ],
            assert(ctx) {
                chai.expect(ctx.scopes.root.functions['']).to.be.undefined;
            }
        }
    ]
});
