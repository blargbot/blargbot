import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.uridecode;

export class UriDecodeSubtag extends CompiledSubtag {
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
