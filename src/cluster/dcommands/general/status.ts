import type { CommandContext } from '@blargbot/cluster/command/index.js';
import { GlobalCommand } from '@blargbot/cluster/command/index.js';
import { CommandType, randChoose } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.status;

export class StatusCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'status',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{status:integer} {animal?}',
                    description: cmd.default.description,
                    execute: (ctx, [status, animal]) => this.getStatus(status.asInteger, animal.asOptionalString, ctx)
                }
            ]
        });
    }

    public async getStatus(status: number, animal: string | undefined, context: CommandContext): Promise<CommandResult> {
        animal = animal?.toLowerCase();
        const service = statusKeys.has(animal) ? statusSites[animal] : randChoose(Object.values(statusSites));
        const response = await context.util.fetch(`${service}${status}.jpg`);
        let content;
        if (response.ok && response.headers.get('content-type') === 'image/jpeg') {
            content = await response.arrayBuffer();
        } else {
            status = 404;
            const response = await context.util.fetch(`${service}404.jpg`);
            if (!response.ok || response.headers.get('content-type') !== 'image/jpeg')
                return cmd.default.notFound;
            content = await response.arrayBuffer();
        }

        return {
            file: [
                {
                    name: `${status}.jpg`,
                    file: Buffer.from(content)
                }
            ]
        };
    }
}

const statusSites = {
    cat: 'https://http.cat/',
    dog: 'https://http.dog/',
    goat: 'https://httpgoats.com/'
} as const;
const statusKeys = new Set(Object.keys(statusSites));
