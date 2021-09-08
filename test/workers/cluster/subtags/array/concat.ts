import { ConcatSubtag } from '@cluster/subtags/array/concat';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { testExecute } from '../baseSubtagTests';

describe('{concat}', () => {
    const subtag = new ConcatSubtag();

    describe('#execute', () => {
        testExecute(subtag, [
            { args: ['abc', 'def', 'ghi'], expected: '["abc","def","ghi"]' },
            { args: ['abc', 'def', '[123,456]', 'ghi'], expected: '["abc","def",123,456,"ghi"]' },
            { args: ['a', '[1,"b"]', '{"n":"idk","v":[2,"c",3]}'], expected: '["a",1,"b",2,"c",3]' }
        ]);
    });

    describe('#concatArrays', () => {
        it('Should correctly concat non-arrays into an array', () => {
            // arrange
            const expected = '["abc","def","ghi"]';

            // act
            const result = subtag.concatArrays(['abc', 'def', 'ghi']);

            // assert
            expect(result).to.equal(expected);
        });

        it('Should correctly concat a mix of arrays and non arrays into an array', () => {
            // arrange
            const expected = '["abc","def",123,456,"ghi"]';

            // act
            const result = subtag.concatArrays(['abc', 'def', '[123,456]', 'ghi']);

            // assert
            expect(result).to.equal(expected);
        });

        it('Should correctly concat named arrays into an array', () => {
            // arrange
            const expected = '["a",1,"b",2,"c",3]';

            // act
            const result = subtag.concatArrays(['a', '[1,"b"]', '{"n":"idk","v":[2,"c",3]}']);

            // assert
            expect(result).to.equal(expected);
        });
    });
});
