<template>
    <div class='card'>
        <div class='card-content'>
            <span class='card-title'>{{title}}</span>
            <slot name='content'></slot>
        </div>
        <div class='card-action' v-if='links'>
            <slot name='links'></slot>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        title: String,
        links: Boolean
    }
}
</script>

<style scoped>

</style>