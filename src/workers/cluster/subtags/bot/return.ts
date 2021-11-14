import { BBTagContext, Subtag } from '@cluster/bbtag';
import { RuntimeReturnState } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class ReturnSubtag extends Subtag {
    public constructor() {
        super({
            name: 'return',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['force?:true'],
                    description: 'Stops execution of the tag and returns what has been parsed. ' +
                        'If `force` is `true` then it will also return from any tags calling this tag.',
                    exampleCode: 'This will display. {return} This will not.',
                    exampleOut: 'This will display.',
                    returns: 'nothing',
                    execute: (context, [forcedStr]) => this.setReturn(context, forcedStr.value)
                }
            ]
        });
    }

    public setReturn(context: BBTagContext, forcedStr: string): void {
        const forced = parse.boolean(forcedStr, true);
        context.state.return = forced ? RuntimeReturnState.ALL : RuntimeReturnState.CURRENTTAG;
    }
}
