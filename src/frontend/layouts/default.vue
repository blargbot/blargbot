<template>
  <div class='body-wrapper'>
    <Header/>
    <main class='fill'>
      <div class='body-wrapper'>
      <nuxt class='fill'/>
      <Footer/>
      </div>
    </main>
  </div>
</template>

<script>
import Header from "~/components/Header.vue";
import Footer from "~/components/Footer.vue";
export default {
  components: { Header, Footer },
  mounted() {},
  watch: {}
};
</script>

<style lang="scss" scoped>
.body-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  padding: 0;
}
.body-wrapper > .fill {
  flex: 1;
}
</style>
