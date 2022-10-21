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
                    description: 'Returns a single zero width space (unicode 200B)',
                    exampleCode: '{zws}',
                    exampleOut: '\u200B',
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
