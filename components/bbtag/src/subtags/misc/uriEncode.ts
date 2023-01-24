import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.uriEncode;

@Subtag.id('uriEncode')
@Subtag.ctorArgs()
export class UriEncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
