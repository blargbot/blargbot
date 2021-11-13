import { Subtag } from '@cluster/bbtag';
import { humanize, SubtagType } from '@cluster/utils';

export class UpperSubtag extends Subtag {
    public constructor() {
        super({
            name: 'upper',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Returns the decancered version of `text`.',
                    exampleCode: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}',
                    exampleOut: 'haha im so edgy',
                    returns: 'string',
                    execute: (_, [text]) => humanize.decancer(text.value)
                }
            ]
        });
    }
}
