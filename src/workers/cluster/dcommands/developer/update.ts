import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { exec } from 'child_process';

export class UpdateCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'update',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: '{semVer:literal(patch|minor|major)=patch}',
                    description: 'Updates the codebase to the latest commit.',
                    execute: (ctx, [type]) => this.update(ctx, type)
                }
            ]
        });
    }

    public async update(context: CommandContext, type: string): Promise<string> {
        const oldCommit = await execCommandline('git rev-parse HEAD');

        if ((await this.showCommand(context, 'git pull')).includes('Already up to date'))
            return this.success('No update required!');

        try {
            await this.showCommand(context, 'yarn install');
        } catch (err: unknown) {
            context.logger.error(err);
            await this.showCommand(context, `git reset --hard ${oldCommit}`);
            // Dont need to do yarn install on the old commit as yarn doesnt modify node_modules if it fails
            return this.error('Failed to update due to a package issue');
        }

        try {
            await this.showCommand(context, 'yarn rebuild');
            let { major = 1, minor = 0, patch = 0 } = await context.database.vars.get('version') ?? {};
            switch (type.toLowerCase()) {
                case 'major':
                    major++;
                    minor = patch = 0;
                    break;
                case 'minor':
                    minor++;
                    patch = 0;
                    break;
                default:
                    patch++;
                    break;
            }
            await context.database.vars.set('version', { major, minor, patch });
            const newCommit = await execCommandline('git rev-parse HEAD');
            return this.success(`Updated to version ${major}.${minor}.${patch} commit \`${newCommit}\`!\nRun \`${context.prefix}restart\` to gracefully start all the clusters on this new version.`);
        } catch (err: unknown) {
            context.logger.error(err);
        }

        // Rollback as something went wrong above
        try {
            await this.showCommand(context, `git reset --hard ${oldCommit}`);
            await this.showCommand(context, 'yarn install');
            await this.showCommand(context, 'yarn rebuild');
            return this.error(`Failed to update due to a build issue, but successfully rolled back to commit \`${oldCommit}\``);
        } catch (err: unknown) {
            context.logger.error(err);
            return this.error('A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.');
        }
    }

    private async showCommand(context: CommandContext, command: string): Promise<string> {
        const message = await context.reply(this.info(`Command: \`${command}\`\nRunning...`));
        try {
            await context.channel.sendTyping();
            const result = cleanConsole(await execCommandline(command));
            const payload = {
                content: this.success(`Command: \`${command}\``),
                files: [
                    {
                        attachment: Buffer.from(result),
                        name: 'output.txt'
                    }
                ]
            };
            await (message?.edit(payload) ?? context.reply(payload));
            return result;
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
