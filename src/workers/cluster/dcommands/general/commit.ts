import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, mapping, randInt } from '@cluster/utils';
import packageJson from '@package';
import { MessageEmbedOptions } from 'discord.js';
import fetch, { Response } from 'node-fetch';

export class CommitCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'commit',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{commitNumber:integer?}',
                    description: 'Gets a random or specified blargbot commit.',
                    execute: (_, [commitNumber]) => this.getCommit(commitNumber.asInteger)
                }
            ]
        });
    }

    public async getCommit(commitNumber: number | undefined): Promise<MessageEmbedOptions | string> {
        const commitCount = await this.fetchCommitCount();
        if (commitCount === 0)
            return this.error('I cant find any commits at the moment, please try again later!');

        commitNumber ??= randInt(1, commitCount);
        commitNumber = Math.min(commitCount, Math.max(commitNumber, 1));

        const commit = await this.fetchCommit(commitCount - commitNumber);
        if (commit === undefined)
            return this.error('I couldnt find the commit!');

        return {
            author: {
                name: commit.author?.login ?? commit.commit.author.name,
                iconURL: commit.author?.avatar_url,
                url: commit.author?.html_url
            },
            title: `${commit.sha.substring(0, 7)} - commit #${commitNumber}`,
            url: commit.html_url,
            description: commit.commit.message
        };
    }

    private async fetchCommitCount(): Promise<number> {
        const response = await this.fetchCommitRaw(0);
        const link = response.headers.get('Link');
        if (link === null)
            return 0;

        const match = /(\d+)>; +rel="last"/.exec(link);
        if (match === null)
            return 0;

        return parseInt(match[1]) + 1;
    }

    private async fetchCommit(commitNumber: number): Promise<CommitData | undefined> {
        try {
            const response = await this.fetchCommitRaw(commitNumber);
            const mapped = commitMapping(await response.json());
            return mapped.valid ? mapped.value[0] : undefined;
        } catch {
            return undefined;
        }
    }

    private async fetchCommitRaw(commitNumber: number): Promise<Response> {
        return await fetch(`${packageJson.repository.url.replace('github.com', 'api.github.com/repos')}/commits?per_page=1&page=${commitNumber}`);
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

const commitMapping = mapping.mapArray(
    mapping.mapObject<CommitData>({
        author: mapping.mapObject<CommitData['author']>({
            avatar_url: mapping.mapString,
            html_url: mapping.mapString,
            login: mapping.mapString
        }, { ifUndefined: mapping.result.undefined }),
        commit: mapping.mapObject({
            author: mapping.mapObject({
                name: mapping.mapString
            }),
            message: mapping.mapString
        }),
        html_url: mapping.mapString,
        sha: mapping.mapString
    })
);
/* eslint-enable @typescript-eslint/naming-convention */
