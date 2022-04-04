import { BBTagRuntimeError, NotAnArrayError } from '@blargbot/bbtag/errors';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json';
import { JsonSortSubtag } from '@blargbot/bbtag/subtags/json/jsonsort';
import { SubtagVariableType } from '@blargbot/domain/models';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new JsonSortSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points}',
            expected: '[{"points":3,"name":"UNO"},{"points":6,"name":"Stupid cat"},{"points":10,"name":"Blargbot"},{"points":12,"name":"Winner"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points;a}',
            expected: '[{"points":12,"name":"Winner"},{"points":10,"name":"Blargbot"},{"points":6,"name":"Stupid cat"},{"points":3,"name":"UNO"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonsort;arrayVar;points}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arrayVar`] = [
                    { points: 10, name: 'Blargbot' },
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 12, name: 'Winner' }
                ];
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('arrayVar')).value).to.deep.equal([
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 10, name: 'Blargbot' },
                    { points: 12, name: 'Winner' }
                ]);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arrayVar`] = [
                    { points: 10, name: 'Blargbot' },
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 12, name: 'Winner' }
                ];
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('arrayVar')).value).to.deep.equal([
                    { points: 12, name: 'Winner' },
                    { points: 10, name: 'Blargbot' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 3, name: 'UNO' }
                ]);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '`Cannot read property points at index 1, 1 total failures`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Cannot read property points at index 1, 1 total failures') }
            ],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arrayVar`] = [
                    { points: 10, name: 'Blargbot' },
                    { test: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 12, name: 'Winner' }
                ];
            }
        },
        {
            code: '{jsonsort;arrayVar;abc;a}',
            expected: '`Cannot read property abc at index 0, 4 total failures`',
            errors: [
                { start: 0, end: 25, error: new BBTagRuntimeError('Cannot read property abc at index 0, 4 total failures') }
            ],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arrayVar`] = [
                    { points: 10, name: 'Blargbot' },
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 12, name: 'Winner' }
                ];
            }
        },
        {
            code: '{jsonsort;testVar;abc;a}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 24, error: new NotAnArrayError('testVar') }
            ],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.testVar`] = 'xyz';
            }
        }
    ]
});
