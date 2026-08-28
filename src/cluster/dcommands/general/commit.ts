import type { CommandContext } from '@blargbot/cluster/command/index.js';
import { GlobalCommand } from '@blargbot/cluster/command/index.js';
import { CommandType, randInt } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';

import templates from '../../text.js';
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

        commitNumber ??= randInt(1, commitCount);
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
            const mapped = commitMapping(await response.json());
            return mapped.valid ? mapped.value[0] : undefined;
        } catch {
            return undefined;
        }
    }

    async #fetchCommitRaw(commitNumber: number, context: CommandContext): Promise<Response> {
        return await context.util.fetch(`https://api.github.com/repos/blargbot/blargbot/commits?per_page=1&page=${commitNumber}`);
    }
}

/* eslint-disable @typescript-eslint/naming-convention */
interface CommitData {
    sha: string;
    html_url: string;
    author?: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    commit: {
        author: {
            name: string;
        };
        message: string;
    };
}

const commitMapping = mapping.array(
    mapping.object<CommitData>({
        author: mapping.object<CommitData['author']>({
            avatar_url: mapping.string,
            html_url: mapping.string,
            login: mapping.string
        }).optional,
        commit: mapping.object({
            author: mapping.object({
                name: mapping.string
            }),
            message: mapping.string
        }),
        html_url: mapping.string,
        sha: mapping.string
    })
);
/* eslint-enable @typescript-eslint/naming-convention */
