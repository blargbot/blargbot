import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class LangSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'lang',
            category: SubtagType.LANG,
            deprecated: true,
            definition: [
                {
                    parameters: ['language'],
                    description: 'Specifies which `language` should be used when viewing the raw of this tag',
                    exampleCode: 'This will be displayed with js! {lang;js}.',
                    exampleOut: 'This will be displayed with js!.',
                    execute: () => ''
                }
            ]
        });
    }
}
