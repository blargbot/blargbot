import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { createSafeRegExp, SubtagType } from '@cluster/utils';

export class RegexTestSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'regextest',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex'],
                    description: 'Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false). Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                        '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                        '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
                    exampleCode: '{regextest;apple;/p+/i} {regextest;banana;/p+/i}',
                    exampleOut: 'true false',
                    execute: (_context, [{ value: text }, { raw: regexStr }]): string | void => {
                        try {
                            const regexResult = createSafeRegExp(regexStr);
                            if (!regexResult.success) {
                                let reason: string;
                                switch (regexResult.reason) {
                                    case 'invalid':
                                        reason = 'Invalid Regex';
                                        break;
                                    case 'tooLong':
                                        reason = 'Regex too long';
                                        break;
                                    case 'unsafe':
                                        reason = 'Unsafe Regex';
                                }
                                throw new BBTagRuntimeError(reason);
                            }
                            return regexResult.regex.test(text).toString();
                        } catch (e: unknown) {
                            if (e instanceof Error)
                                throw new BBTagRuntimeError(e.message);
                        }
                    }
                }
            ]
        });
    }
}
