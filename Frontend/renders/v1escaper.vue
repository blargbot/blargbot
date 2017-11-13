<template>
  <div>
    <div class='row'>
      <form class='col s12 blue-grey darken-1 escape-form'>
        <div class='row'>
          <div class='input-field col s12'>
            <textarea v-model='content' v-on:input='changed()' id='tbContent' class='materialize-textarea'></textarea>
            <label for='tbContent' class='grey-text text-lighten-2 active'>Escaped</label>
          </div>
        </div>
      </form>
    </div>
    <div class='row'>
      <div class='col s12 blue-grey darken-2 bevel'>
        <textarea class='materialize-textarea grey-text text-lighten-3' ref='hah' id='escaped-content' v-model='escaped' readonly>

        </textarea>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import card from "../components/card.vue";

export default {
  data: () => ({
    content: "{}"
  }),
  computed: {
    escaped() {
      try {
        return this.content
          .replace(/\{/g, "\uE001")
          .replace(/\}/g, "{rb}")
          .replace(/\uE001/g, "{lb}");
      } catch (err) {
        return err.stack;
      }
    }
  },
  methods: {
    changed() {
      $("#escaped-content").trigger("autoresize");
    },
    copyClipboard() {
      this.$refs.hah.select();
      document.execCommand("copy");
      Materialize.toast("Copied!", 1000);
    }
  },
  components: {
    card,
    VueMarkdown
  }
};
</script>

<style scoped>
.escape-form {
  border-radius: 10px;
  padding: 5px;
}

#tbContent:not(:focus),
#iTitle:not(:focus) {
  border-bottom-color: #e0e0e0 !important;
}

.button-bar {
  margin: 10px;
}

.bevel {
  border-radius: 10px;
}
</style>