import { encode } from 'html-entities';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.htmlencode;

export class HtmlEncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'htmlencode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.htmlEncode(text.value) // TODO: use subtag.source
                }
            ]
        });
    }

    public htmlEncode(html: string): string {
        return encode(html);
    }
}
