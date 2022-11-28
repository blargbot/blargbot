import { GlobalCommand } from '../../command/index';
import { CommandType, randInt } from '@blargbot/cluster/utils';
import { User } from 'eris';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.ship;

export class ShipCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'ship',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{user1:user} {user2:user}',
                    description: cmd.default.description,
                    execute: (_, [user1, user2]) => this.getShipName(user1.asUser, user2.asUser)
                }
            ]
        });
    }

    public getShipName(user1: User, user2: User): CommandResult {
        const order = randInt(0, 1);
        const first = [user1, user2][order];
        const second = [user1, user2][1 - order];

        const firstHalf = first.username.slice(0, first.username.length / 2);
        const secondHalf = second.username.slice(second.username.length / 2);

        return cmd.default.success({ name: firstHalf + secondHalf });
    }
}
