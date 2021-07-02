import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class RandUserSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'randuser',
            category: SubtagType.API,
            aliases: ['absolute'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns the id of a random user on the current guild.',
                    exampleCode: '{username;{randuser}} is a lovely person! {username;{randuser}} isn\'t as good.',
                    exampleOut: 'abalabahaha is a lovely person! stupid cat isn\'t as good.',
                    execute: (context) => {
                        const members = context.guild.members.map(m => m.id);
                        return members[Math.floor(Math.random() * members.length)];
                    }
                }
            ]
        });
    }
}