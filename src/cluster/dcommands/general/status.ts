import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randChoose } from '@blargbot/cluster/utils';
import fetch from 'node-fetch';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.status;

export class StatusCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `status`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{status:integer} {animal?}`,
                    description: cmd.default.description,
                    execute: (_, [status, animal]) => this.getStatus(status.asInteger, animal.asOptionalString)
                }
            ]
        });
    }

    public async getStatus(status: number, animal: string | undefined): Promise<CommandResult> {
        animal = animal?.toLowerCase();
        const service = statusKeys.has(animal) ? statusSites[animal] : randChoose(Object.values(statusSites));
        const response = await fetch(`${service}${status}.jpg`);
        let content;
        if (response.ok && response.headers.get(`content-type`) === `image/jpeg`) {
            content = await response.buffer();
        } else {
            status = 404;
            const response = await fetch(`${service}404.jpg`);
            if (!response.ok || response.headers.get(`content-type`) !== `image/jpeg`)
                return cmd.default.notFound;
            content = await response.buffer();
        }

        return {
            files: [
                {
                    name: `${status}.jpg`,
                    file: content
                }
            ]
        };
    }
}

const statusSites = {
    cat: `https://http.cat/`,
    dog: `https://httpstatusdogs.com/img/`
} as const;
const statusKeys = new Set(Object.keys(statusSites));
