<template>
  <div>
    <slot name='heading'></slot>
    <slot></slot>

    <div v-if='Object.keys(collapseData).length === 0'>
      <div class='center loading'>
        <h1>{{$t('website.generic.loading')}}</h1>
        <spinner></spinner>
      </div>
    </div>
    <div v-else>
      <div class='row'>
        <div class='col s12 m12'>
          <div class='row'>
            <div class='input-field col s12'>
              <input id='search' type='text' class='validate' v-model='filter'>
              <label for='search'>{{$t('website.generic.search')}}</label>
            </div>
            <div class='col s12 m6'>
              <button class='waves-effect waves-light btn full' v-on:click='expandAll()'>
                {{$t('website.generic.expand')}}
              </button>
            </div>
            <div class='col s12 m6'>
              <button class='waves-effect waves-light btn full' v-on:click='collapseAll()'>
                {{$t('website.generic.collapse')}}
              </button>
            </div>
          </div>
          <div v-if='filter !== ""'>
            <p v-if='totalCount === 0' class='flow-text center'>
              {{$t('website.generic.noresults')}}
            </p>
            <p v-else class='flow-text center'>
              {{$t('website.generic.resultsfound') + ' ' + totalCount}}
            </p>
          </div>
          <ul>
            <li v-for='key in keys' :key='key'>
              <div v-if='filteredElements(key).length > 0'>
                <div class='blue-grey darken-3 categoryHeader z-depth-2'>
                  <h3>{{key}}</h3>
                </div>
                <ul class='collapse'>
                  <li v-for='(element, index) in filteredElements(key)' :key='element.id' :id='element.id' :class='element.active ? "active" : ""'>
                    <div class='collapse-header' v-on:click='toggle(key, index)'>{{element.name}}</div>
                    <div class='collapse-body'>
                      <vue-markdown :linkify='false' :source='element.data'></vue-markdown>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import spinner from "../components/spinner.vue";

export default {
  data: () => ({
    filter: ""
  }),
  props: ["collapseData", "keys"],
  computed: {
    totalCount() {
      return this.keys.reduce((a, c) => {
        return a + this.filteredElements(c).length;
      }, 0);
    }
  },
  methods: {
    filteredElements(key) {
      return this.collapseData[key].filter(s => {
        if (this.filter === "") return true;
        return `${key}.${s.name}`.includes((this.filter || "").toLowerCase());
      });
    },
    collapseAll() {
      for (const key in this.collapseData) {
        let filtered = this.filteredElements(key);
        for (const index in filtered) {
          let subtag = filtered[index];
          if (subtag.active) {
            subtag.active = false;
            let body = document.getElementById(`${key}.${subtag.name}`)
              .children[1];
            $(body).slideUp();
            this.$set(
              this.collapseData[key],
              this.collapseData[key].indexOf(subtag),
              subtag
            );
          }
        }
      }
    },
    expandAll() {
      for (const key in this.collapseData) {
        let filtered = this.filteredElements(key);
        for (const index in filtered) {
          let element = filtered[index];
          if (!element.active) {
            element.active = true;
            let body = document.getElementById(element.id).children[1];
            $(body).slideDown();
            this.$set(
              this.collapseData[key],
              this.collapseData[key].indexOf(element),
              element
            );
          }
        }
      }
    },
    toggle(key, index) {
      let element = this.filteredElements(key)[index];
      let e = document.getElementById(element.id);
      let body = e.children[1];

      if (element.active) {
        $(body).slideUp();
        element.active = false;
      } else {
        $(body).slideDown();
        element.active = true;
      }
      this.$set(
        this.collapseData[key],
        this.collapseData[key].indexOf(element),
        element
      );
    }
  },
  components: {
    VueMarkdown,
    spinner
  },
  mounted() {
    this.filter = this.$route.params.name;
  }
};
</script>

<style>
.loading {
  padding: 30px;
}

.categoryHeader {
  padding: 15px;
}
</style>
