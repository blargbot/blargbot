import { VariableCache } from '@cluster/bbtag';
import { ShuffleSubtag } from '@cluster/subtags/array/shuffle';
import { expect } from 'chai';
import { describe } from 'mocha';
import { instance, satisfies, verify, when } from 'ts-mockito';

import { testExecute, testExecuteFail, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{shuffle}', () => {
    const subtag = new ShuffleSubtag();
    describe('#execute', () => {
        testExecute(subtag, [
            {
                args: [],
                expected: undefined,
                details: { input: [] }
            },
            {
                args: [],
                expected: undefined,
                details: { input: [...new Array<undefined>(1000)].map((_, i) => i.toString()) }
            }
        ].map(x => ({
            ...x,
            get title(): string { return `${this.details.input.length} tag args`; }
        })), {
        }, {
            arrange(ctx, _, __, details) {
                when(ctx.contextMock.input).thenReturn([...details.input]);
            },
            assert(ctx, _, __, details) {
                const input = instance(ctx.contextMock).input;
                if (details.input.length > 0)
                    expect(input).to.not.have.ordered.members(details.input);
                expect(input).to.have.members(details.input);
            }
        });
        testExecuteFail(subtag, [
            { args: ['123'], error: 'Not an array' },
            { args: ['[123'], error: 'Not an array' }
        ]);
        testExecute(subtag, [
            {
                args: ['[]'],
                expected: '[]',
                details: { args: [] }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9,10]'],
                details: { args: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
            }
        ], {}, {
            assert(...[, , , details, result]) {
                const val = JSON.parse(result ?? '[]');
                if (details.args.length > 0)
                    expect(val).to.not.have.ordered.members(details.args);
                expect(val).to.have.members(details.args);
            }
        });
        testExecute(subtag, [
            {
                args: ['{"n":"~arr","v":[]}'],
                expected: undefined,
                details: { var: '~arr', val: [] }
            },
            {
                args: ['{"n":"~arr","v":[1,2,3,4,5,6]}'],
                expected: undefined,
                details: { var: '~arr', val: [1, 2, 3, 4, 5, 6] }
            }
        ], {
            variablesMock: VariableCache
        }, {
            arrange(ctx, _, __, details) {
                when(ctx.contextMock.variables).thenReturn(instance(ctx.variablesMock));
                when(ctx.variablesMock.set(details.var, satisfies(isPermutationOf(details.val)))).thenResolve();
            },
            assert(ctx, _, __, details) {
                verify(ctx.variablesMock.set(details.var, satisfies(isPermutationOf(details.val)))).once();
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['[1]', '[2]'], expectedCount: 1 }
        ]);
    });
});

function isPermutationOf(expected: JToken[]): (value: JToken[]) => boolean {
    const name = `isPermutationOf([${expected.join(',')}])`;
    return {
        [name](value: JToken[]): boolean {
            try {
                if (expected.length > 0)
                    expect(value).to.not.have.ordered.members(expected);
                expect(value).to.have.members(expected);
                return true;
            } catch {
                return false;
            }
        }
    }[name];
}
