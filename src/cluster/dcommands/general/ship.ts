import { BaseGlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randInt } from '@blargbot/cluster/utils';
import { User } from 'eris';

export class ShipCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'ship',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{user1:user} {user2:user}',
                    description: 'Gives you the ship name for two users.',
                    execute: (_, [user1, user2]) => this.getShipName(user1.asUser, user2.asUser)
                }
            ]
        });
    }

    public getShipName(user1: User, user2: User): string {
        const order = randInt(0, 1);
        const first = [user1, user2][order];
        const second = [user1, user2][1 - order];

        const firstHalf = first.username.slice(0, first.username.length / 2);
        const secondHalf = second.username.slice(second.username.length / 2);

        return `❤️ Your ship name is **${firstHalf}${secondHalf}**!`;
    }
}
