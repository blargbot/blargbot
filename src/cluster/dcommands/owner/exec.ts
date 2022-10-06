import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { codeBlock, CommandType } from '@blargbot/cluster/utils';
import { exec } from 'child_process';

export class ExecCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `exec`,
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: `{~command+}`,
                    description: `Executes a command on the current shell`,
                    execute: (ctx, [command]) => this.commandLine(ctx, command.asString)
                }
            ]
        });
    }

    public async commandLine(context: CommandContext, command: string): Promise<string | undefined> {
        if (/pm2 (restart|reload|start)/i.test(command))
            return this.error(`No! That's dangerous! Do \`b!restart\` instead.\n\nIt's not that I don't trust you, it's just...\n\nI don't trust you.`);

        if (!await context.util.queryConfirm({
            context: context.message,
            actors: context.author,
            prompt: this.warning(`You are about to execute the following on the command line:${codeBlock(command, `bash`)}`),
            confirm: `Continue`,
            cancel: `Cancel`,
            fallback: false
        }))
            return this.success(`Execution cancelled`);

        const message = await context.reply(`Command: \`${command}\`\nRunning....`);
        try {
            await context.channel.sendTyping();
            const content = this.success(`Command: \`${command}\``);
            const file = {
                file: Buffer.from(cleanConsole(await execCommandline(command))),
                name: `output.txt`
            };
            await (message?.channel.editMessage(message.id, { content, file }) ?? context.reply({ content, files: [file] }));
        } catch (err: unknown) {
            const content = this.error(`Command: \`${command}\``);
            const file = {
                file: Buffer.from(cleanConsole(err instanceof Error ? err.toString() : Object.prototype.toString.call(err))),
                name: `output.txt`
            };
            await (message?.channel.editMessage(message.id, { content, file }) ?? context.reply({ content, files: [file] }));
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
    return text.replace(/\u001b\[.*?m/g, ``);
}
