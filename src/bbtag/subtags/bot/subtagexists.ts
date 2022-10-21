import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.subtagexists;

export class SubtagExistsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'subtagexists',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['subtag'],
                    description: 'Checks to see if `subtag` exists.',
                    exampleCode: '{subtagexists;ban} {subtagexists;AllenKey}',
                    exampleOut: 'true false',
                    returns: 'boolean',
                    execute: (ctx, [subtag]) => ctx.subtags.get(subtag.value) !== undefined
                }
            ]
        });
    }
}
