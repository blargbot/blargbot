const generalApiOverrides = [
    // API subtags
    `dm`,
    `send`,
    `edit`,
    `delete`,
    `kick`,
    `ban`,
    `reactadd`,
    `reactremove`,
    `roleadd`,
    `rolecreate`,
    `roledelete`,
    `roleremove`,
    `rolesetmentionable`,
    `webhook`,

    // Moderation subtags
    `warn`,
    `modlog`,
    `pardon`,

    // Misc subtags
    `embed`,
    `waitmessage`,
    `waitreact`,
    `sleep`
];

export const overrides = {
    filter: generalApiOverrides,
    waitmessage: generalApiOverrides,
    waitreaction: generalApiOverrides
};
