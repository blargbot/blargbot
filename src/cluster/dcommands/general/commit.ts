import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand } from '@blargbot/cluster';
import { util } from '@blargbot/formatting';
import { random } from '@blargbot/util';
import z from 'zod';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.commit;

export class CommitCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'commit',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{commitNumber:integer?}',
                    description: cmd.default.description,
                    execute: (ctx, [commitNumber]) => this.getCommit(commitNumber.asOptionalInteger, ctx)
                }
            ]
        });
    }

    public async getCommit(commitNumber: number | undefined, context: CommandContext): Promise<CommandResult> {
        const commitCount = await this.#fetchCommitCount(context);
        if (commitCount === 0)
            return cmd.default.noCommits;

        commitNumber ??= random.int(1, commitCount);
        commitNumber = Math.min(commitCount, Math.max(commitNumber, 1));

        const commit = await this.#fetchCommit(commitCount - commitNumber, context);
        if (commit === undefined)
            return cmd.default.unknownCommit;

        return {
            embeds: [
                {
                    author: {
                        name: util.literal(commit.author?.login ?? commit.commit.author.name),
                        icon_url: commit.author?.avatar_url,
                        url: commit.author?.html_url
                    },
                    title: cmd.default.embed.title({ commit: commit.sha.slice(0, 7), index: commitNumber }),
                    url: commit.html_url,
                    description: util.literal(commit.commit.message)
                }
            ]
        };
    }

    async #fetchCommitCount(context: CommandContext): Promise<number> {
        const response = await this.#fetchCommitRaw(0, context);
        const link = response.headers.get('Link');
        if (link === null)
            return 0;

        const match = /(\d+)>; +rel="last"/.exec(link);
        if (match === null)
            return 0;

        return parseInt(match[1]) + 1;
    }

    async #fetchCommit(commitNumber: number, context: CommandContext): Promise<CommitData | undefined> {
        try {
            const response = await this.#fetchCommitRaw(commitNumber, context);
            const mapped = commitMapping.safeParse(await response.json());
            return mapped.success ? mapped.data[0] : undefined;
        } catch {
            return undefined;
        }
    }

    async #fetchCommitRaw(commitNumber: number, context: CommandContext): Promise<Response> {
        return await context.util.fetch(`https://api.github.com/repos/blargbot/blargbot/commits?per_page=1&page=${commitNumber}`);
    }
}

const commitMapping = z.object({
    author: z.object({
        avatar_url: z.string(),
        html_url: z.string(),
        login: z.string()
    }).optional(),
    commit: z.object({
        author: z.object({
            name: z.string()
        }),
        message: z.string()
    }),
    html_url: z.string(),
    sha: z.string()
}).array();
type CommitData = z.infer<typeof commitMapping>[number];
