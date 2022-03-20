import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class UriDecodeSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'uridecode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Decodes `text` from URI format.',
                    exampleCode: '{uridecode;Hello%20world}',
                    exampleOut: 'Hello world!',
                    returns: 'string',
                    execute: (_, [text]) => this.decodeUri(text.value)
                }
            ]
        });
    }

    public decodeUri(text: string): string {
        try {
            return decodeURIComponent(text);
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}
