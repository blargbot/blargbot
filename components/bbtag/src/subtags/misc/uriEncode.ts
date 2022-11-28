import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.uriEncode;

export class UriEncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'uriEncode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
