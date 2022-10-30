import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.lang;

export class LangSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lang',
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
