import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.lang;

@Subtag.id('lang')
@Subtag.ctorArgs()
export class LangSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            deprecated: true,
            hidden: true,
            definition: [
                {
                    parameters: ['language'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: () => this.godIHateThisSubtag()
                }
            ]
        });
    }

    public godIHateThisSubtag(): void {
        /* NOOP */
    }
}
