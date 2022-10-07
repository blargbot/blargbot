import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';

export class RespondCommand extends GlobalCommand {

    public constructor() {
        super({
            name: `respond`,
            category: CommandType.SUPPORT,
            definitions: [
                {
                    parameters: `{id:number} {~response+}`,
                    description: `Responds to a suggestion, bug report or feature request`,
                    execute: (ctx, [id, response]) => this.respond(ctx, id.asNumber, response.asString)
                }
            ]
        });
    }

    public async respond(context: CommandContext, id: number, response: string): Promise<string> {
        const feedback = await context.database.suggestions.get(id);

        if (feedback === undefined)
            return `❌ I couldnt find that feeback!`;

        await context.database.suggestions.update(id, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Notes: `${response} (${humanize.fullName(context.author)})${feedback.Notes !== undefined ? `\n\n${feedback.Notes}` : ``}`
        });

        const author = await context.database.suggestors.get(feedback.Author[0]);
        if (author === undefined)
            return `⚠️ Feedback successfully updated\n⛔ I couldnt find the user who submitted that feedback`;

        const msg = await context.send(feedback.Channel, `**Hi, <@${author.ID}>!**  You recently made this suggestion:\n\n**${feedback.Title}**${feedback.Description.length > 0 ? `\n\n${feedback.Description}` : ``}\n\n**${humanize.fullName(context.author)}** has responded to your feedback with this:\n\n${response}\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing \`b!invite\`. Thanks for your time!\n\nYour card has been updated here: <${context.util.websiteLink(`feedback/${id}`)}>`);

        if (msg === undefined)
            return `⚠️ Feedback successfully updated\n⛔ I wasnt able to send the response in the channel where the feedback was initially sent`;

        return `✅ Feedback successfully updated and response has been sent.`;
    }
}
