<template>
  <div id="inner" class="row card-body">
    <div class="col-1">
      <div id="viewer3d"></div>
    </div>
    <div class="col-2">
      <h5>Option</h5>
      <b-button
        type="button"
        class="btn btn-secondary btn-block"
        v-on:click="toggleVisibility"
      >
        Toggle Controls
      </b-button>
      <b-button
        type="button"
        class="btn btn-secondary btn-block"
        v-on:click="toggleNucleotide"
      >
        Toggle Nucleotide
      </b-button>
      <b-button
        type="button"
        class="btn btn-secondary btn-block"
        v-on:click="toggleStick"
      >
        Toggle Sticks
      </b-button>
      <b-button
        type="button"
        class="btn btn-secondary btn-block"
        v-on:click="updateA"
      >
        updateA
      </b-button>
      <br />
      <attribute-card2
        v-for="item in default_cards"
        v-bind:chains="chains"
        v-bind:synced_data.sync="item"
        v-bind:key="item.id"
        v-on:update:synced_data="logChange(item)"
      ></attribute-card2>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
import { MolstarDemoViewer } from './mol_viewer';
import 'molstar/build/viewer/molstar.css';
import attributeCard2 from './card2';

export default {
  name: 'molviewer',
  components: {
    attributeCard2
  },
  props: ['pdbFile', 'cards', 'chains'],
  watch:{
    chains: function(newVal, oldVal) { // watch it
      console.log('Prop changed: ', newVal, ' | was: ', oldVal);
      this.default_cards = [];
      this.default_cards.push(
        {chain: newVal[0],
          color: 'cyan',
          opacity: null,
          type: 'model',
          model_type: 'cartoon',
          render: false,
          removed: false,
          default: true,
          added_attributes: []
        },
        {chain: newVal[1],
          color: 'pink',
          opacity: null,
          type: 'model',
          model_type: 'cartoon',
          render: false,
          removed: false,
          default: true,
          added_attributes: []
        }
      );
      // this.viewer.dispose();
      this.viewer.loadStructureFromData(this.pdbFile, 'pdb', {
        type: this.structure3dRepresentation,
        coloring: this.structure3dColoring,
        uniformColor: this.uniformColor },
        this.default_cards
      );
      this.viewer.toggleControls(false);
      this.viewer.cards = this.default_cards;
    }
  },
  data: () => ({
    structure3d: null,
    structure3dRepresentation: 'cartoon',
    structure3dColoring: 'element-symbol',
    uniformColor: { r: 51, g: 158, b: 0 },
    viewer: null,
    default_cards: [],
    controls: null,
    show_nucleotide: true,
    show_stick: false
  }),
  mounted: function() {
    let viewer = new MolstarDemoViewer(this.$el.querySelector('#viewer3d'));
    this.viewer = viewer;
    this.controls = true;
    this.default_cards.push(
      {chain: this.chains[0],
        color: 'cyan',
        opacity: null,
        type: 'model',
        model_type: 'cartoon',
        render: false,
        removed: false,
        default: true,
        added_attributes: []
      },
      {chain: this.chains[1],
        color: 'pink',
        opacity: null,
        type: 'model',
        model_type: 'cartoon',
        render: false,
        removed: false,
        default: true,
        added_attributes: []
      });
    viewer.loadStructureFromData(this.pdbFile, 'pdb', {
      type: this.structure3dRepresentation,
      coloring: this.structure3dColoring,
      uniformColor: this.uniformColor },
      this.default_cards
    );
    fetch(this.pdbFile)
      .then(function(res) {
        console.log(res);
      })
      .catch(function(e) {
        console.error(e);
      });
  },
  methods: {
    toggleVisibility: function() {
      this.controls = !this.controls;
      this.viewer.toggleControls(this.controls);
    },
    updateA: function(){
      this.viewer.updateA();
    },
    toggleNucleotide: function() {
      this.show_nucleotide = !this.show_nucleotide;
      if (!this.show_nucleotide) {
        this.structure3dRepresentation = 'no_nucleotide';
      } else {
        this.structure3dRepresentation = 'cartoon';
      }
      this.updateModel();
    },
    toggleStick: function() {
      this.show_stick = !this.show_stick;
      if (this.show_stick) {
        this.structure3dRepresentation = 'ball-and-stick';
      } else {
        this.structure3dRepresentation = 'cartoon';
      }
      this.updateModel();
    },
    updateModel: function() {
      this.viewer.updateMoleculeRepresentation({
        type: this.structure3dRepresentation,
        coloring: this.structure3dColoring,
        uniformColor: this.uniformColor
      });
    },
    logChange: function(change) {
      // currently also calls reloadCards to update visual display, this function is called when card2 changes
      // console.log("Changes:\n\n");
      // console.log(change);
      this.viewer.reloadCards([change]);
    }
  },
  computed: {
    Viewer3dProps: function() {
      return this.structure3dRepresentation;
    }
  }
};
</script>

<style scoped>
#inner {
  min-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: row;
}
#viewer3d {
  height: 100%;
  width: 100%;
}

.col-1 {
  max-width: calc(100% - 250px);
  flex-grow: 1;
  padding: 0px;
  min-height: 80vh;
}
.col-2 {
  min-width: 250px;
  height: 80vh;
  padding: 5px;
  flex-direction: column;
}

.card-body {
  padding: 5px;
  margin: 0px;
}
</style>
