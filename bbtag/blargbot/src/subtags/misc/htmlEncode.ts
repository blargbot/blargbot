import htmlEntities from 'html-entities';

import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.htmlEncode;

@Subtag.id('htmlEncode')
@Subtag.ctorArgs()
export class HtmlEncodeSubtag extends CompiledSubtag {
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
                    execute: (_, [text]) => this.htmlEncode(text.value) // TODO: use subtag.source
                }
            ]
        });
    }

    public htmlEncode(html: string): string {
        return htmlEntities.encode(html);
    }
}
