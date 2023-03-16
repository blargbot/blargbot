import { catchErrors } from '@blargbot/catch-decorators';

import type { BBTagRuntime } from './BBTagRuntime.js';
import { CompiledSubtag } from './compilation/CompiledSubtag.js';
import { BBTagRuntimeError } from './errors/index.js';

export abstract class RegexSubtag extends CompiledSubtag {

    @catchErrors.thenThrow(Error, err => new BBTagRuntimeError(err.message))
    protected createRegex(context: BBTagRuntime, regexStr: string): RegExp {
        const regexResult = context.runner.converter.regex(regexStr);
        if (regexResult.success)
            return regexResult.value;
        switch (regexResult.reason) {
            case 'invalid': throw new BBTagRuntimeError('Invalid Regex');
            case 'tooLong': throw new BBTagRuntimeError('Regex too long');
            case 'unsafe': throw new BBTagRuntimeError('Unsafe Regex');
        }
    }
}
