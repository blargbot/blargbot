<template>
  <div class='box'>
    <section class='container'>
      <h1 class="title center">
        oops, {{ error.statusCode }}
      </h1>
      <p class='center'>{{ error.message }}</p>
      <div class='flex-row'>
        <nuxt-link class="flex-row-item button flat" to="/">
          Home
        </nuxt-link>
        <div class='flex-row-separator'></div>
        <a class="flex-row-item button flat" @click.prevent="$router.go(-1);">
          Back
        </a>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  props: ["error"]
};
</script>
<style lang="scss" scoped>
.flex-row {
  display: flex;
  flex-direction: row;
  margin: 0 auto;

  .flex-row-item {
    flex: 1 1 auto;
  }
}
</style>
