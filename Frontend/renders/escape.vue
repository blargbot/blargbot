<template>
  <div>
    <div class='row'>
      <form class='col s12 m6 blue-grey darken-1 escape-form'>
        <div class='row'>
          <div class='input-field col s12'>
            <input v-model='title' id='iTitle' class='validate'>
            <label for='iTitle' class='grey-text text-lighten-2 active'>Title</label>
          </div>

          <div class='input-field col s12'>
            <textarea v-model='content' id='tbContent' class='materialize-textarea'></textarea>
            <label for='tbContent' class='grey-text text-lighten-2 active'>Raw Markdown</label>
          </div>

        </div>
      </form>
      <div class='col s12 m6'>
        <vue-markdown :source='content' class='markdown'></vue-markdown>
      </div>
    </div>
    <div class='row'>
      <div class='col s12 blue-grey darken-2 bevel'>
        <div class='row button-bar'>
          <div class='col s6'>
            <button class='waves-effect waves-light btn full' v-on:click='copyClipboard'>Copy</button>
          </div>
          <div class='col s6'>
            <button class='waves-effect waves-light btn full' v-on:click='exportJson'>Export</button>
          </div>
        </div>
        <textarea class='materialize-textarea grey-text text-lighten-3' ref='hah' v-model='jsoned' readonly>

        </textarea>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import card from '../components/card.vue';

export default {
  data: () => ({
    content: '# Title\n\nPut fancy markdown here.',
    title: '',
    denyChoices: ['lol no', 'fat chance', 'why bother', 'hahaha nice try', 'meh, nah',
      'id rather not', 'please stop trying', 'it is futile', 'look behind you', 'meow', 'whats the point']
  }),
  computed: {
    jsoned() {
      let obj = { [this.title]: this.content }
      return JSON.stringify(obj, null, 2);
    },
    jsonedCodeblock() {
      return '```json\n' + this.jsoned + '\n```';
    }
  },
  methods: {
    exportJson() {
      let arr = this.denyChoices;
      Materialize.toast(arr[Math.floor(Math.random() * arr.length)], 1000);
    },
    copyClipboard() {
      console.log(this.$refs.hah);
      this.$refs.hah.select();
      document.execCommand('copy');
      Materialize.toast('Copied!', 1000);
    }
  },
  components: {
    card, VueMarkdown
  },
  meta: {
    name: 'Commands'
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