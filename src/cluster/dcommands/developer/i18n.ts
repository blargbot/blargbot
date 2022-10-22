import { FormatString } from '@blargbot/domain/messages/FormatString';

import { GlobalCommand } from '../../command/GlobalCommand';
import templates from '../../text';
import { CommandResult } from '../../types';
import { CommandType } from '../../utils/index';

const cmd = templates.commands.i18n;

export class I18nCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'i18n',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: 'export',
                    description: cmd.exports.description,
                    execute: () => this.export()
                }
            ]
        });
    }

    public export(): CommandResult {
        const result: I18nExport = {};
        for (const entry of FormatString.list()) {
            const path = entry.id.split('.');
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const name = path.pop()!;
            let current = result;
            for (const key of path) {
                const val = current[key] ??= {};
                if (typeof val === 'string')
                    throw new Error(`Key conflict - ${entry.id} conflicts with another key`);
                current = val;
            }
            if (current[name] !== undefined)
                throw new Error(`Key conflict - ${entry.id} conflicts with another key`);

            current[name] = entry.template;
        }

        return {
            files: [
                {
                    file: JSON.stringify(result),
                    name: 'blargbot-strings.json'
                }
            ]
        };
    }

}

interface I18nExport {
    [key: string]: string | I18nExport | undefined;
}
