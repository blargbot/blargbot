import { BaseSubtag } from '@cluster/bbtag';
import { createSafeRegExp, SubtagType } from '@cluster/utils';

export class RegexSplitSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'regexsplit',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text', '~regex'],
                    description: 'Splits the given text using the given `regex` as the split rule. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                    '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                    '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
                    exampleCode: '{regexsplit;Hello      there, I       am hungry;/[\\s,]+/}',
                    exampleOut: '["Hello","there","I","am","hungry"]',
                    execute: (context, [{value: text}, {raw: regexStr}], subtag): string | void => {
                        try {
                            const regexResult = createSafeRegExp(regexStr);
                            if (!regexResult.success) {
                                let reason: string;
                                switch(regexResult.reason) {
                                    case 'invalid':
                                        reason = 'Invalid Regex';
                                        break;
                                    case 'tooLong':
                                        reason = 'Regex too long';
                                        break;
                                    case 'unsafe':
                                        reason = 'Unsafe Regex';
                                }
                                return this.customError(reason, context, subtag);
                            }
                            return JSON.stringify(text.split(regexResult.regex));
                        } catch (e: unknown) {
                            if (e instanceof Error)
                                return this.customError(e.message, context, subtag);
                        }
                    }
                }
            ]
        });
    }
}
