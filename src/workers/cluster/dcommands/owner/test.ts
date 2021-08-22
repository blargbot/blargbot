import { BaseGlobalCommand } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class TestCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'test',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{anything+?}',
                    description: 'Idk, a test command or something',
                    execute: () => this.runTest()
                }
            ]
        });
    }

    public runTest(): never {
        throw new Error('Something went RIGHT');
    }
}
