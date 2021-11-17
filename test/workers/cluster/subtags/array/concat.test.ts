import { ConcatSubtag } from '@cluster/subtags/array/concat';
import { describe } from 'mocha';

import { testExecute, testExecuteNotEnoughArgs } from '../baseSubtagTests';

describe('{concat}', () => {
    const subtag = new ConcatSubtag();

    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 1 }
        ]);
        testExecute(subtag, [
            { args: ['abc'], expected: '["abc"]' },
            { args: ['[123,456]'], expected: '[123,456]' },
            { args: ['abc', 'def', 'ghi'], expected: '["abc","def","ghi"]' },
            { args: ['abc', 'def', '[123,456]', 'ghi'], expected: '["abc","def",123,456,"ghi"]' },
            { args: ['a', '[1,"b"]', '{"n":"idk","v":[2,"c",3]}'], expected: '["a",1,"b",2,"c",3]' }
        ]);
    });
});
