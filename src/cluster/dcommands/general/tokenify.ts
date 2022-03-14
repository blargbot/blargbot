import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, randInt } from '@cluster/utils';

export class TokenifyCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'tokenify',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{input+}',
                    description: 'Converts the given input into a token.',
                    execute: (_, [input]) => this.tokenify(input.asString)
                }
            ]
        });
    }

    public tokenify(input: string): string {
        const pasta = input.replace(/[^0-9a-z]/gi, '').toLowerCase();
        const newPasta = [];

        for (let i = 0; i < pasta.length; i++) {
            newPasta.push(randInt(1, 4) >= 3
                ? pasta[i].toUpperCase()
                : pasta[i].toLowerCase());

            if (i === pasta.length - 1)
                newPasta.length; // NOOP
            else if (randInt(1, 20) === 1)
                newPasta.push('.');
            else if (randInt(1, 30) === 1)
                newPasta.push('-');
            else if (randInt(1, 30) === 30)
                newPasta.push('\\_');
        }

        return newPasta.join('');
    }
}
