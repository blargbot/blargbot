import { exec } from 'node:child_process';

import { CommandType } from '@blargbot/cluster/utils/index.js';

import { CommandContext, GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.update;

export class UpdateCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'update',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: '{semVer:literal(patch|minor|major)=patch}',
                    description: cmd.default.description,
                    execute: (ctx, [type]) => this.update(ctx, type.asLiteral)
                }
            ]
        });
    }

    public async update(context: CommandContext, type: string): Promise<CommandResult> {
        const oldCommit = await execCommandline('git rev-parse HEAD');

        if ((await this.#showCommand(context, 'git pull')).includes('Already up to date'))
            return cmd.default.noUpdate;

        try {
            await this.#showCommand(context, 'yarn install');
        } catch (err: unknown) {
            context.logger.error(err);
            await this.#showCommand(context, `git reset --hard ${oldCommit}`);
            // Dont need to do yarn install on the old commit as yarn doesnt modify node_modules if it fails
            return cmd.default.packageIssue;
        }

        try {
            await this.#showCommand(context, 'yarn run rebuild');

            await context.cluster.version.updateVersion(type);

            const version = await context.cluster.version.getVersion();
            const newCommit = await execCommandline('git rev-parse HEAD');
            return cmd.default.success({ commit: newCommit, prefix: context.prefix, version });
        } catch (err: unknown) {
            context.logger.error(err);
        }

        // Rollback as something went wrong above
        try {
            await this.#showCommand(context, `git reset --hard ${oldCommit}`);
            await this.#showCommand(context, 'yarn install');
            await this.#showCommand(context, 'yarn run rebuild');
            return cmd.default.buildIssue({ commit: oldCommit });
        } catch (err: unknown) {
            context.logger.error(err);
            return cmd.default.rollbackIssue;
        }
    }

    async #showCommand(context: CommandContext, command: string): Promise<string> {
        const message = await context.reply(cmd.default.command.pending({ command }));
        try {
            await context.channel.sendTyping();
            const result = cleanConsole(await execCommandline(command));
            const content = cmd.default.command.success({ command });
            const file = {
                file: Buffer.from(result),
                name: 'output.txt'
            };
            message === undefined
                ? await context.reply({ content, file: [file] })
                : await context.edit(message, { content, file: [file] });
            return result;
        } catch (err: unknown) {
            const content = cmd.default.command.error({ command });
            const result = cleanConsole(err instanceof Error ? err.toString() : Object.prototype.toString.call(err));
            const file = {
                file: Buffer.from(result),
                name: 'output.txt'
            };
            message === undefined
                ? await context.reply({ content, file: [file] })
                : await context.edit(message, { content, file: [file] });
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
