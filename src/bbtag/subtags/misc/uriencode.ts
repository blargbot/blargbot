import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.uriencode;

export class UriEncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'uriencode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Encodes `text` in URI format. Useful for constructing links.',
                    exampleCode: '{uriencode;Hello world!}',
                    exampleOut: 'Hello%20world!',
                    returns: 'string',
                    execute: (_, [text]) => this.encodeUri(text.value)
                }
            ]
        });
    }

    public encodeUri(text: string): string {
        return encodeURIComponent(text);
    }
}
