import { catchErrors } from '@blargbot/catch-decorators';
import { createSafeRegExp } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from './compilation/CompiledSubtag.js';
import { BBTagRuntimeError } from './errors/index.js';

export abstract class RegexSubtag extends CompiledSubtag {

    @catchErrors.thenThrow(Error, err => new BBTagRuntimeError(err.message))
    protected createRegex(regexStr: string): RegExp {
        const regexResult = createSafeRegExp(regexStr);
        switch (regexResult.state) {
            case 'success': return regexResult.regex;
            case 'invalid': throw new BBTagRuntimeError('Invalid Regex');
            case 'tooLong': throw new BBTagRuntimeError('Regex too long');
            case 'unsafe': throw new BBTagRuntimeError('Unsafe Regex');
        }
    }
}
