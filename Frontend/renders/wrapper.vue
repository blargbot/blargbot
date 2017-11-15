<template>
  <div>
    <router-view>
    </router-view>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import card from "../components/card.vue";

export default {
  data: () => ({}),
  components: {
    card,
    VueMarkdown
  }
};
</script>

<style scoped>
.main-desc {
  max-width: 600px;
  text-align: center;
  margin: 20px auto;
}
</style>