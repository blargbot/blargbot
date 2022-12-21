import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class GuildOwnerIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildOwnerId',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
