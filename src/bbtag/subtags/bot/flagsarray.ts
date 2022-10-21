import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.flagsarray;

export class FlagsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'flagsarray',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of all flags provided.',
                    exampleCode: '{flagsarray}',
                    exampleIn: 'Hello -dc world',
                    exampleOut: '["_","d","c"]',
                    returns: 'string[]',
                    execute: (ctx) => this.flagKeys(ctx)
                }
            ]
        });
    }

    public flagKeys(context: BBTagContext): string[] {
        return Object.keys(context.flaggedInput);
    }
}
