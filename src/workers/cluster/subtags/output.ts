import { BaseSubtag, SubtagType } from '../core';

export class OutputSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'output',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text?'],
                    description: 'Forces an early send of the default output message, using `text` as the text to show. ' +
                        'If this is used then there will be no output sent once the tag finishes. Only 1 `{output}` may be used per ' +
                        'tag/cc. If a second `{output}` is used then the result of the first `{output}` will be returned instead.' +
                        '\nThe message id of the output that was sent will be returned.',
                    exampleCode: '{output;Hello!}',
                    exampleOut: 'Hello!',
                    execute: async (context, [{ value: text }], subtag) => {
                        if (context.state.outputMessage !== undefined && text.length > 0)
                            return this.customError('Cannot send multiple outputs', context, subtag);
                        return await context.sendOutput(text) ?? '';
                    }
                }
            ]
        });
    }
}
