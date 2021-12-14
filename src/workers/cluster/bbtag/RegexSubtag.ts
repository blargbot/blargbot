import { createSafeRegExp } from '@cluster/utils';

import { BBTagRuntimeError } from './errors';
import { Subtag } from './Subtag';

export abstract class RegexSubtag extends Subtag {

    protected createRegex(regexStr: string): RegExp {
        try {
            const regexResult = createSafeRegExp(regexStr);
            switch (regexResult.state) {
                case 'success': return regexResult.regex;
                case 'invalid': throw new BBTagRuntimeError('Invalid Regex');
                case 'tooLong': throw new BBTagRuntimeError('Regex too long');
                case 'unsafe': throw new BBTagRuntimeError('Unsafe Regex');
            }
        } catch (err: unknown) {
            if (err instanceof BBTagRuntimeError)
                throw err;
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}