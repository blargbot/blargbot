<template>
  <div class='embed' :style="'border-left-color: ' + source.color">
    <img :src='source.thumbnail.url' v-if='source.thumbnail.url' class='thumbnail'>
    <div v-if='source.author.name'>
      <h5>
        <img :src='source.author.icon_url' v-if='source.author.icon_url' class='icon avatar'>
        <a v-if='source.author.url' :href='source.author.url'>
          {{source.author.name}}
        </a>
        <span v-else>
          {{source.author.name}}
        </span>
      </h5>
    </div>
    <h5>
      <a v-if='source.url' :href='source.url'>
        {{source.title}}
      </a>
      <span v-else>
        {{source.title}}
      </span>
    </h5>
    <vue-markdown :source='source.description'></vue-markdown>
    <div class='flex-wrap' v-if='source.fields.length > 0'>
      <div :class="'field ' + (field.inline ? 'inline' : '')" v-for='field in source.fields'>
        <h5 class='name'>{{field.name}}</h5>
        <vue-markdown class='value' :source='field.value'></vue-markdown>
      </div>
    </div>
    <img :src='source.image.url' v-if='source.image.url' class='p-image'>
    <div v-if='source.footer.text || tdate' class='footer'>
      <img :src='source.footer.icon_url' v-if='source.footer.icon_url' class='icon footer-icon'>
      <vue-markdown :source='source.footer.text' class='inline-block'></vue-markdown>
      <span v-if='source.footer.text && tdate' class='fdivider'>|</span>
      <span v-if='tdate'>{{tdate}}</span>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import moment from "moment";

export default {
  components: { VueMarkdown },
  props: ["source"],
  computed: {
    tdate() {
      try {
        let date = moment(this.source.timestamp);
        if (!date.isValid()) return "";
        return date.format("ddd MMM Do, YYYY [at] h:mm A");
      } catch (err) {
        console.error(err);
        return "";
      }
    }
  }
};
</script>


<style scoped>
.fdivider {
  margin: 0 3px;
}
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}
.flex-wrap .field {
  flex: 1 0 100%;
}
.flex-wrap .field.inline {
  flex: 1 1 auto;
}
.thumbnail {
  max-height: 100px;
  max-width: 100px;
  float: right;
}
.p-image {
  max-width: 520px;
}
.inline-block {
  display: inline-block;
}
.footer-icon {
  margin: 3px;
  border-radius: 2px;
  font-size: 1.64rem;
}
.icon {
  display: inline-block;
  height: 1em;
  vertical-align: middle;
}
.avatar {
  border-radius: 100px;
}

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
