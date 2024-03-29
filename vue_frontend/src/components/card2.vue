<template>
    <div class="card border-info">
        <div class="card-header">
          <span>{{type}} for chain {{selected_chain}}</span>
          <b-button-close v-on:click="removeItem()" class="btn"></b-button-close>
        </div>
        <div class="level">
          <b-container class="bv-example-row">
            <b-row v-if="type === 'model'">
              <b-form-select
                v-model="model_type" :options="styles" @change="update_model_type();" >Pick Style
              </b-form-select>
            </b-row>
            <b-row v-if="type === 'model'">
              <b-form-select
                v-model="color" :options="color_options" @change="$emit('update:synced_data', update());" >Pick Color
              </b-form-select>
            </b-row>
            <b-row v-if="type === 'model'" class="opacity">
              <b-col>
                <div >Opacity: {{ opacity }}</div>
              </b-col>
              <b-col>
                <b-form-input
                  placeholder="Opacity" v-model="opacity" type='range' min="0" max="1" step="0.1" @change="$emit('update:synced_data', update());">
                </b-form-input>
              </b-col>
            </b-row>
          </b-container>
        </div>
    </div>
</template>

<script>
import { ColorNames } from 'molstar/lib/mol-util/color/names'

export default {
  name: 'attribute-card2',
  props: ['chains', 'synced_data'],
  watch: {
    chains: function (newVal, oldVal) { // watch it
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        console.log('Prop changed: ', JSON.stringify(newVal), ' | was: ', JSON.stringify(oldVal));
        this.selected_chain = this.synced_data['chain'];
        this.update();
      }
    },
  },
  data: function () {
    return {
      selected_chain: this.synced_data['chain'],
      opacity: this.synced_data['opacity'],
      color: this.synced_data['color'],
      color_scheme: this.synced_data['color_scheme'],
      type: this.synced_data['type'],
      model_type: this.synced_data['model_type'],
      return_data: this.synced_data,
      added_attributes: this.synced_data['added_attributes'],
      default: this.synced_data['default'],
      render: true,
      removed: false,
      surface: null,
      styles: [
        {id: 0, value: null, text: 'Select a style', disabled: true},
        {id: 1, value: 'ball-and-stick', text: 'ball-and-stick'},
        {id: 2, value: 'cartoon', text: 'cartoon'},
        {id: 3, value: 'line', text: 'line'},
        {id: 4, value: 'ellipsoid', text: 'ellipsoid'},
        {id: 5, value: 'label', text: 'label'},
        {id: 6, value: 'point', text: 'point'},
        {id: 7, value: 'putty', text: 'putty'},
        {id: 8, value: 'gaussian-volume', text: 'gaussian-volume'},
        {id: 9, value: 'gaussian-surface', text: 'gaussian-surface'},
        {id: 10, value: 'spacefill', text: 'spacefill'},
        {id: 11, value: 'molecular-surface', text: 'molecular-surface'},
      ],
      color_options: Object.keys(ColorNames),
      color_scheme_options: [],
      valid_attributes_options: [],
      valid_attributes: [],
      disabled: true,
      count: 0
    }
  },
  mounted: function () {
    let color_schemes = ['None'].concat(Object.keys($3Dmol.builtinColorSchemes).concat(['greenCarbon', 'cyanCarbon', // eslint-disable-line
      'yellowCarbon', 'whiteCarbon', 'magentaCarbon']));
    color_schemes.forEach((el, index) => this.color_scheme_options.push({id: index, value: el, text: el}));
    this.$emit('update:synced_data', this.update());
  },
  methods: {
    removeItem: function () {
      this.removed = true;
      this.render = false;
      this.added_attributes = [];
      this.$emit('update:synced_data', this.update());
      this.$destroy();
      // remove the element from the DOM
      this.$el.parentNode.removeChild(this.$el);
    },
    update: function () {
      this.return_data['opacity'] = this.opacity;
      this.return_data['color'] = this.color;
      this.return_data['color_scheme'] = this.color_scheme;
      this.return_data['chain'] = this.selected_chain;
      this.return_data['render'] = this.render;
      this.return_data['model_type'] = this.model_type;
      this.return_data['removed'] = this.removed;
      this.return_data['added_attributes'] = this.added_attributes
      if (this.default) {
        // console.log(this.model_type);
        let item = this.addAttribute();
        item.selected_attribute = 'color';
        this.updateAttributes(item);
        item.value = this.color;
        this.default = false;
      }
      return this.return_data;
    },
    update_model_type: function () {
      this.added_attributes = [];
      this.$emit('update:synced_data', this.update());
    },
    calculate_valid_attributes: function () {
      // console.log(this.type);
      let validAttributes = this.type === 'model' ? $3Dmol.GLModel.validAtomStyleSpecs[this.model_type].validItems // eslint-disable-line
        : this.type === 'surface' ? $3Dmol.GLModel.validSurfaceSpecs // eslint-disable-line
          : $3Dmol.GLModel.validLabelResSpecs; // eslint-disable-line
      let options = [{value: null, text: 'Options'}];
      $.each(validAttributes, (key, value) => {
        if (value.gui) {
          options.push({value: key, text: key});
        }
      });
      this.valid_attributes = validAttributes;
      this.valid_attributes_options = options;
    },
    addAttribute: function () {
      // console.log(this.model_type);
      if (this.model_type !== null) {
        this.calculate_valid_attributes();
        let new_attribute = {id: this.count++,
          value: null,
          valid_values: null,
          selected_attribute: null,
          discrete: false};
        this.added_attributes.push(new_attribute);
        return new_attribute;
      }
    },
    removeAttribute: function (id) {
      for (let i = 0; i < this.added_attributes.length; i++) {
        if (this.added_attributes[i].id === id) {
          this.added_attributes.splice(i, 1);
          break;
        }
      }
      this.$emit('update:synced_data', this.update());
    },
    updateAttributes: function (item) {
      let key = item.selected_attribute;
      if (key != null) {
        let attribute_type = this.valid_attributes[key].type
        let discrete_types = ['color', 'colorscheme', 'boolean'];
        item.discrete = (discrete_types.includes(attribute_type) || this.valid_attributes[key].validItems !== undefined);
        if (item.discrete) {
          item.valid_values = attribute_type === 'boolean' ? [false, true]
            : attribute_type === 'color' ? Object.keys($3Dmol.htmlColors) // eslint-disable-line
              : attribute_type === 'colorscheme' ? this.color_scheme_options
                : this.valid_attributes[key].validItems;
          item.value = item.valid_values[0];
        } else {
          item.value = null;
        }
      } else {
        item.valid_values = null;
        item.value = null;
      }
    },
    recalcAttributes: function (item) {
      this.updateAttributes(item);
      this.$emit('update:synced_data', this.update());
    }
  }
}

</script>

<style scoped>
.card {
    margin-bottom: 20px;
}
.card-header {
    padding: 7px;
    padding-left: 20px;
}

.opacity{
  padding: 3px;
  white-space: nowrap;
}

</style>
