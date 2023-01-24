import htmlEntities from 'html-entities';

import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.htmlDecode;

@Subtag.id('htmlDecode')
@Subtag.factory()
export class HtmlDecodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, text) => this.htmlDecode(text.map(arg => arg.value).join(';'))
                }
            ]
        });
    }

    public htmlDecode(text: string): string {
        return htmlEntities.decode(text);
    }
}
