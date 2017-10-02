<template>
    <div slot="content">
        <p>
            Hello, {{user.username}}!
        </p>
        <p>You are currently in {{user.guilds.length}} guild!</p>

        <ul class='collection'>
            <li class='collection-item avatar' v-for='guild in user.guilds' :key='guild.id'>
                <img :src='guild.iconURL' alt='' class='circle'>
                <span class='title'>{{guild.name}}</span>
            </li>
        </ul>
    </div>
</template>

<script>

export default {
    data: () => ({
    })
};
</script>

<style scoped>

</style>