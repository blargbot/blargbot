import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, randChoose } from '@cluster/utils';
import { FileOptions } from 'discord.js';
import fetch from 'node-fetch';

export class StatusCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'status',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{status:integer} {animal?}',
                    description: 'Gets you an image of an HTTP status code.',
                    execute: (_, [status, animal]) => this.getStatus(status.asInteger, animal.asOptionalString)
                }
            ]
        });
    }

    public async getStatus(status: number, animal: string | undefined): Promise<string | FileOptions> {
        animal = animal?.toLowerCase();
        const service = statusKeys.has(animal) ? statusSites[animal] : randChoose(Object.values(statusSites));
        const response = await fetch(`${service}${status}.jpg`);
        let content;
        if (response.ok && response.headers.get('content-type') === 'image/jpeg') {
            content = await response.buffer();
        } else {
            status = 404;
            const response = await fetch(`${service}404.jpg`);
            if (!response.ok || response.headers.get('content-type') !== 'image/jpeg')
                return this.error('Something terrible has happened! 404 is not found!');
            content = await response.buffer();
        }

        return {
            name: `${status}.jpg`,
            attachment: content
        };
    }
}

const statusSites = {
    cat: 'https://http.cat/',
    dog: 'https://httpstatusdogs.com/img/'
} as const;
const statusKeys = new Set(Object.keys(statusSites));
