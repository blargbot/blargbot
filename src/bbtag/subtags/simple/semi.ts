import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.semi;

export class SemiSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'semi',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `;`',
                    exampleCode: 'This is a semicolon! {semi}',
                    exampleOut: 'This is a semicolon! ;',
                    returns: 'string',
                    execute: () => this.getSemiColon()
                }
            ]
        });
    }

    public getSemiColon(): ';' {
        return `;`;
    }
}
