import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.quiet;

export class QuietSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'quiet',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['isQuiet?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [quiet]) => this.setQuiet(ctx, quiet.value)
                }
            ]
        });
    }

    public setQuiet(context: BBTagContext, valueStr: string): void {
        context.scopes.local.quiet = parse.boolean(valueStr);
    }
}
