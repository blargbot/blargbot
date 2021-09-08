import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { codeBlock, CommandType } from '@cluster/utils';
import { exec } from 'child_process';

export class ExecCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'exec',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{~command+}',
                    description: 'Executes a command on the current shell',
                    execute: (ctx, [command]) => this.commandLine(ctx, command.asString)
                }
            ]
        });
    }

    public async commandLine(context: CommandContext, command: string): Promise<string | undefined> {
        if (/pm2 (restart|reload|start)/i.test(command))
            return this.error('No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.');

        if (!await context.util.queryConfirm({
            context: context.message,
            actors: context.author,
            prompt: this.warning(`You are about to execute the following on the command line:${codeBlock(command, 'bash')}`),
            confirm: 'Continue',
            cancel: 'Cancel',
            fallback: false
        }))
            return this.success('Execution cancelled');

        const message = await context.reply(`Command: \`${command}\`\nRunning....`);
        try {
            await context.channel.sendTyping();
            const payload = {
                content: this.success(`Command: \`${command}\``),
                files: [
                    {
                        attachment: Buffer.from(cleanConsole(await execCommandline(command))),
                        name: 'output.txt'
                    }
                ]
            };
            await (message?.edit(payload) ?? context.reply(payload));
            return undefined;
        } catch (err: unknown) {
            const payload = {
                content: this.error(`Command: \`${command}\``),
                files: [
                    {
                        // eslint-disable-next-line no-control-regex
                        attachment: Buffer.from(cleanConsole(err instanceof Error ? err.toString() : Object.prototype.toString.call(err))),
                        name: 'output.txt'
                    }
                ]
            };
            await (message?.edit(payload) ?? context.reply(payload));
            throw err;
        }
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
