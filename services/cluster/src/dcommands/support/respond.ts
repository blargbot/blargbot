import { CommandType } from '@blargbot/cluster/utils/index.js';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.respond;

export class RespondCommand extends GlobalCommand {

    public constructor() {
        super({
            name: 'respond',
            category: CommandType.SUPPORT,
            definitions: [
                {
                    parameters: '{id:number} {~response+}',
                    description: cmd.default.description,
                    execute: (ctx, [id, response]) => this.respond(ctx, id.asNumber, response.asString)
                }
            ]
        });
    }

    public async respond(context: CommandContext, id: number, response: string): Promise<CommandResult> {
        const feedback = await context.database.suggestions.get(id);

        if (feedback === undefined)
            return cmd.default.notFound;

        await context.database.suggestions.update(id, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Notes: `${response} (${context.author.username}#${context.author.discriminator})${feedback.Notes !== undefined ? `\n\n${feedback.Notes}` : ''}`
        });

        const author = await context.database.suggesters.get(feedback.Author[0]);
        if (author === undefined)
            return cmd.default.userNotFound;

        const msg = await context.send(feedback.Channel, cmd.default.alert({
            description: feedback.Description,
            link: context.util.websiteLink(`feedback/${id}`).toString(),
            respondent: context.author,
            response,
            submitterId: author.ID,
            title: feedback.Title
        }));

        if (msg === undefined)
            return cmd.default.alertFailed;

        return cmd.default.success;
    }
}
