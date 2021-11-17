import { IsArraySubtag } from '@cluster/subtags/array/isarray';
import { describe } from 'mocha';

import { testExecute, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{isarray}', () => {
    const subtag = new IsArraySubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 1 }
        ]);
        testExecute(subtag, [
            { args: ['123'], expected: 'false' },
            { args: ['abc'], expected: 'false' },
            { args: ['[123]'], expected: 'true' },
            { args: ['["abc"]'], expected: 'true' },
            { args: ['{"n":"idk","v":["abc"]}'], expected: 'true' }
        ]);
        testExecuteTooManyArgs(subtag, [
            { args: ['123', '456'], expectedCount: 1 }
        ]);
    });
});
