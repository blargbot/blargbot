import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { exec } from 'child_process';

export class UpdateCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'update',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: '{semVer:literal(patch|minor|major)=patch}',
                    description: 'Updates the codebase to the latest commit.',
                    execute: (ctx, [type]) => this.update(ctx, type.asLiteral)
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
            await this.showCommand(context, 'yarn run rebuild');

            await context.cluster.version.updateVersion(type);

            const version = await context.cluster.version.getVersion();
            const newCommit = await execCommandline('git rev-parse HEAD');
            return this.success(`Updated to version ${version} commit \`${newCommit}\`!\nRun \`${context.prefix}restart\` to gracefully start all the clusters on this new version.`);
        } catch (err: unknown) {
            context.logger.error(err);
        }

        // Rollback as something went wrong above
        try {
            await this.showCommand(context, `git reset --hard ${oldCommit}`);
            await this.showCommand(context, 'yarn install');
            await this.showCommand(context, 'yarn run rebuild');
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
            const content = this.success(`Command: \`${command}\``);
            const file = {
                file: Buffer.from(result),
                name: 'output.txt'
            };
            await (message?.channel.editMessage(message.id, { content, file }) ?? context.reply({ content, files: [file] }));
            return result;
        } catch (err: unknown) {
            const content = this.error(`Command: \`${command}\``);
            const file = {
                file: Buffer.from(cleanConsole(err instanceof Error ? err.toString() : Object.prototype.toString.call(err))),
                name: 'output.txt'
            };
            await (message?.channel.editMessage(message.id, { content, file }) ?? context.reply({ content, files: [file] }));
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
