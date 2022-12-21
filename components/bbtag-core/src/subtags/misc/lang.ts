import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class LangSubtag extends Subtag {
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
