export interface GuildVotebans {
    readonly [userId: string]: readonly GuildVoteban[] | undefined;
}

export interface GuildVoteban {
    readonly id: string;
    readonly reason?: string;
}
