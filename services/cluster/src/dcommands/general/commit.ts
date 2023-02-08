import { CommandType, randInt } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';

import { GlobalCommand } from '../../command/index.js';
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
                    execute: (_, [commitNumber]) => this.getCommit(commitNumber.asOptionalInteger)
                }
            ]
        });
    }

    public async getCommit(commitNumber: number | undefined): Promise<CommandResult> {
        const commitCount = await this.#fetchCommitCount();
        if (commitCount === 0)
            return cmd.default.noCommits;

        commitNumber ??= randInt(1, commitCount);
        commitNumber = Math.min(commitCount, Math.max(commitNumber, 1));

        const commit = await this.#fetchCommit(commitCount - commitNumber);
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

    async #fetchCommitCount(): Promise<number> {
        const response = await this.#fetchCommitRaw(0);
        const link = response.headers.get('Link');
        if (link === null)
            return 0;

        const match = /(\d+)>; +rel="last"/.exec(link);
        if (match === null)
            return 0;

        return parseInt(match[1]) + 1;
    }

    async #fetchCommit(commitNumber: number): Promise<CommitData | undefined> {
        try {
            const response = await this.#fetchCommitRaw(commitNumber);
            const mapped = commitMapping(await response.json());
            return mapped.valid ? mapped.value[0] : undefined;
        } catch {
            return undefined;
        }
    }

    async #fetchCommitRaw(commitNumber: number): Promise<Response> {
        return await fetch(`https://api.github.com/repos/blargbot/blargbot/commits?per_page=1&page=${commitNumber}`);
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
