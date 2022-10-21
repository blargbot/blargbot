import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.zws;

export class ZwsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'zws',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: () => this.getZws()
                }
            ]
        });
    }

    public getZws(): '\u200B' {
        return '\u200B';
    }
}
