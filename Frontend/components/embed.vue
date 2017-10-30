<template>
  <div class='embed' :style="'border-left-color: ' + source.color">
      <div v-if='source.author.name'>
              <img :source='source.author.icon_url' v-if='source.author.icon_url'>

          <h5>
              {{source.author.name}}
              </h5>
      </div>
      <h5>{{source.title}}</h5>
      <vue-markdown :source='source.description'></vue-markdown>
      <div v-if='source.footer.text' class='footer'>
          <vue-markdown :source='source.footer.text'></vue-markdown>

      </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";

export default {
  components: { VueMarkdown },
  props: ["source"]
};
</script>


<style scoped>
.embed {
  background: rgba(0, 0, 0, 0.1);
  border-left: 6px solid;
  padding: 15px;
}

.footer {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
