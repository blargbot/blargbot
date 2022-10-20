import { humanize } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class DecancerSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'decancer',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Returns the decancered version of `text`.',
                    exampleCode: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}',
                    exampleOut: 'haha im so edgy',
                    returns: 'string',
                    execute: (_, [text]) => this.decancer(text.value)
                }
            ]
        });
    }

    public decancer(text: string): string {
        return humanize.decancer(text);
    }
}
