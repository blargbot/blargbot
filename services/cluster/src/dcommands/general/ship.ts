import { CommandType, randInt } from '@blargbot/cluster/utils/index.js';
import * as Eris from 'eris';

import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

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

    public getShipName(user1: Eris.User, user2: Eris.User): CommandResult {
        const order = randInt(0, 1);
        const first = [user1, user2][order];
        const second = [user1, user2][1 - order];

        const firstHalf = first.username.slice(0, first.username.length / 2);
        const secondHalf = second.username.slice(second.username.length / 2);

        return cmd.default.success({ name: firstHalf + secondHalf });
    }
}
