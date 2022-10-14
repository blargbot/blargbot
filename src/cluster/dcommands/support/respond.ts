import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.respond;

export class RespondCommand extends GlobalCommand {

    public constructor() {
        super({
            name: `respond`,
            category: CommandType.SUPPORT,
            definitions: [
                {
                    parameters: `{id:number} {~response+}`,
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
            Notes: `${response} (${humanize.fullName(context.author)})${feedback.Notes !== undefined ? `\n\n${feedback.Notes}` : ``}`
        });

        const author = await context.database.suggesters.get(feedback.Author[0]);
        if (author === undefined)
            return cmd.default.userNotFound;

        const msg = await context.send(feedback.Channel, cmd.default.alert({
            description: feedback.Description,
            link: context.util.websiteLink(`feedback/${id}`),
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
