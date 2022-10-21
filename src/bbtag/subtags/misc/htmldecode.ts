import { decode } from 'html-entities';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.htmldecode;

export class HtmlDecodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'htmldecode',
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
        return decode(text);
    }
}
