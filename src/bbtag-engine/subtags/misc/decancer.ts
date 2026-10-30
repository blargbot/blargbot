import limax from 'limax';
import unorm from 'unorm';

import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.decancer;

export class DecancerSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'decancer',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.decancer(text.value)
                }
            ]
        });
    }

    public decancer(text: string): string {
        return unorm.nfkd(text)
            .replace(/[^ ]+/g, text => limax(text, limaxOptions))
            .replaceAll('\u0000', '');
    }
}

const limaxOptions: Parameters<typeof limax>[1] = {
    tone: false,
    separateNumbers: false,
    separateApostrophes: false,
    maintainCase: true,
    custom: Array.from('., !\'"?0123456789'),
    replacement: '\u0000'
};
