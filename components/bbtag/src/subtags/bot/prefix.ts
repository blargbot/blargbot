import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.prefix;

@Subtag.names('prefix')
@Subtag.ctorArgs(Subtag.util())
export class PrefixSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getPrefix(ctx)
                }
            ]
        });

        this.#util = util;
    }

    public getPrefix(context: BBTagContext): string {
        return context.prefix ?? this.#util.defaultPrefix;
    }
}
