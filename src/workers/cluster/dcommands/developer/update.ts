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
                    parameters: 'patch|minor|major',
                    description: 'Updates the codebase to the latest commit.',
                    execute: (ctx) => this.update(ctx, ctx.argsString)
                },
                {
                    parameters: '',
                    description: 'Updates the codebase to the latest commit.',
                    execute: (ctx) => this.update(ctx, 'patch')
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
            await this.showCommand(context, 'yarn clean');
            await this.showCommand(context, 'yarn build');
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
            await this.showCommand(context, 'yarn build');
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
            const result = await execCommandline(command);
            await message?.edit({
                content: this.success(`Command: \`${command}\``),
                files: [
                    {
                        attachment: Buffer.from(result),
                        name: 'output.txt'
                    }
                ]
            });
            return result;
        } catch (err: unknown) {
            if (err instanceof Error)
                await message?.edit({
                    content: this.error(`Command: \`${command}\``),
                    files: [
                        {
                            attachment: Buffer.from(err.toString()),
                            name: 'output.txt'
                        }
                    ]
                });
            else
                await message?.edit({
                    content: this.error(`Command: \`${command}\``),
                    files: [
                        {
                            attachment: Buffer.from(Object.prototype.toString.call(err)),
                            name: 'output.txt'
                        }
                    ]
                });
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
