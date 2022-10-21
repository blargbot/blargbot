import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildownerid;

export class GuildOwnerIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildownerid',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the id of the guild\'s owner.',
                    exampleCode: 'The owner\'s id is {guildownerid}.',
                    exampleOut: 'The owner\'s id is 1234567890123456.',
                    returns: 'id',
                    execute: (ctx) => this.getGuildOwnerId(ctx)
                }
            ]
        });
    }

    public getGuildOwnerId(context: BBTagContext): string {
        return context.guild.ownerID;
    }
}
