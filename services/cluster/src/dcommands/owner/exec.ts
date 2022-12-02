import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { exec } from 'child_process';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.exec;

export class ExecCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'exec',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{~command+}',
                    description: cmd.default.description,
                    execute: (ctx, [command]) => this.commandLine(ctx, command.asString)
                }
            ]
        });
    }

    public async commandLine(context: CommandContext, command: string): Promise<CommandResult> {
        if (/pm2 (restart|reload|start)/i.test(command))
            return cmd.default.pm2Bad;

        if (!await context.queryConfirm({
            prompt: cmd.default.confirm.prompt({ command }),
            continue: cmd.default.confirm.continue,
            cancel: cmd.default.confirm.cancel,
            fallback: false
        }))
            return cmd.default.cancelled;

        const message = await context.reply(cmd.default.command.pending({ command }));
        try {
            await context.channel.sendTyping();
            const content = cmd.default.command.success({ command });
            const file = {
                file: Buffer.from(cleanConsole(await execCommandline(command))),
                name: 'output.txt'
            };
            message === undefined
                ? await context.reply({ content, file: [file] })
                : await context.edit(message, { content, file: [file] });
        } catch (err: unknown) {
            const content = cmd.default.command.error({ command });
            const file = {
                file: Buffer.from(cleanConsole(err instanceof Error ? err.toString() : Object.prototype.toString.call(err))),
                name: 'output.txt'
            };
            message === undefined
                ? await context.reply({ content, file: [file] })
                : await context.edit(message, { content, file: [file] });
        }
        return undefined;
    }
}

async function execCommandline(command: string): Promise<string> {
    return await new Promise<string>((res, rej) => exec(command, (err, stdout, stderr) => {
        if (err !== null)
            rej(new Error(`${err.message}\n${stderr}\n${stdout}`));
        else
            res(`${stderr}\n${stdout}`.trim());
    }));
}

function cleanConsole(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\u001b\[.*?m/g, '');
}
