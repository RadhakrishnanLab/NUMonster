<template>
  <div id='result' class='container main'>
    <div v-if="display_label" class="card">
      <div class="card-header">
        <span>{{display_label}}</span>
        <!-- <b-button-close v-on:click="closeDisplay()" class="btn"></b-button-close> -->
      </div>
      <div v-if="display_graph" class="row card-body">
        <div  class="col-10">
          <div id="graph-container" class="display-container"></div>
        </div>
        <div class="col-2">
          <div id="color-table">
            <h5>Filter Edges</h5>
            <!--<br/>
            <vue-slider v-model="dist_filter" :max=15 lazy=True @change="renderGraph"></vue-slider>-->
            <div v-for='edge in all_edges' :key='edge.id' class='form-check'>
              <div class='parent'>
                <div class='child'>
                <input type='checkbox' v-model='selected_edges' :value='edge.id' @change="renderGraph" class='form-check-input'/>
                <label v-bind:style="{color: edge.color, 'background-color': 'transparent'}" class='form-check-label'>
                  {{ edge.name }}
                </label>
                </div>
                <!-- <template> -->
                <div class='child'>
                  <b-form-input id="distance_value" v-model="edge.value" type="range" :min="edge.min" :max="edge.max" step='0.1'></b-form-input>
                </div>
                <div class='child' id='child1'>
                  {{edge.value}} Å
                </div>
                <!-- </template> -->
              </div>
            </div>
          </div>
        <div class="parent2">
          <b-button type='button' class='btn btn-secondary btn-block' v-on:click='renderGraph'>Update Filter</b-button>
          <b-button type='button' class='btn btn-secondary btn-block' v-on:click='savePic2D'> Save Picture </b-button>
        </div>
          <h5>Info</h5>
          <div id="more-info">
            <!-- {{selected_info}} -->
          </div>
          <div id="related-info">
            <h6>Related</h6>
          </div>
        </div>
      </div>
    </div>
    <div v-if="url_3D" class="card" id="target-box">
      <div class = "text-right">
      <b-button v-b-toggle.collapse class="btn">Toggle</b-button>
      </div>
      <b-collapse visible id="collapse">
        <div v-if="display_graph" class="row card-body">
          <div  class="col-10">
            <div v-if="url_3D" id="container-01" class="mol-container"></div>
          </div>
          <div class="col-2">
            <br/>
            <div id="more-options">
              <h5>Options</h5>
              <b-button type='button' class='btn btn-secondary btn-block' v-on:click='hideResLabels'> {{draw_labels ? 'Hide Residue Labels' : 'Show Residue Labels'}} </b-button>
              <b-button type='button' class='btn btn-secondary btn-block' v-on:click='savePic'> Save Picture </b-button>
              <h5 style="padding-top: 10px;">More Options</h5>
              <div>
                <b-button type='button' class='btn btn-secondary btn-block' v-on:click='addSurfaceCard'> Add Surface </b-button>
                <b-button type='button' class='btn btn-secondary btn-block' v-on:click='addStyleCard'> Add Model </b-button>
              </div>
            </div>
            <br/>
            <div id="added-surfaces">
              <attribute-card
                v-for="item in added_cards"
                v-bind:chains="options"
                v-bind:synced_data.sync="item"
                v-bind:key="item.id"
                v-on:update:synced_data="renderStyles(item, false)"
              ></attribute-card>
              <!-- <p>Parent data is : {{ added_cards }}</p> -->
            </div>
          </div>
        </div>
      </b-collapse>
    </div>

    <div v-if="url_3D" class="card" id="target-box3">
      <div class = "text-right">
       <b-button v-b-toggle.collapse-1 class="btn">Toggle</b-button>
      </div>
      <b-collapse visible id="collapse-1">
        <!-- <div v-if="display_graph" id="molstar-block">
            <molviewer v-if="url_3D" class="card"
                      v-bind:pdb-file="pdbFile"
                      v-bind:cards="added_cards"
            > </molviewer> -->
        <div v-if="display_graph">
          <molviewer v-if="url_3D" class="card"
                     v-bind:pdb-file="pdbFile"
                     v-bind:cards="added_cards"
                     v-bind:chains="[chain1, chain2]"
                     ref="molviewer">
          </molviewer>
        </div>
      </b-collapse>
    </div>

    <br/>
    <h3>
      Results for {{$route.params.job_id}}
    </h3>
    <table class="table table-striped">
      <thead>
      <tr>
        <th>Model</th>
        <th>Chain 1</th>
        <th>Chain 2</th>
        <th colspan="1">View Results</th>
        <th>PDB</th>
        <th>Results</th>
        <th>Logs</th>
      </tr>
      </thead>
      <tbody v-if="result">
        <template v-for="(chains, model) in result.models">
          <template v-for="(links, chain) in chains">
            <tr :key="model+chain">
              <td>{{model}}</td>
              <td>{{chain.slice(0,1)}}</td>
              <td>{{chain.slice(1,2)}}</td>
              <td><button v-if="links.PDB" class="btn btn-secondary" v-on:click='open2D(links.PDB.PDB, links.parsed_bonds, `${chain.slice(0,1)} and ${chain.slice(1,2)} chains from model ${model}`, chain.slice(0,1), chain.slice(1,2))'>2D and 3D Display</button></td>
              <!-- <td><button v-if="links.PDB" class="btn btn-secondary" v-on:click='open3D(links.PDB.PDB, chain.slice(0,1), chain.slice(1,2), `${chain.slice(0,1)} and ${chain.slice(1,2)} chains from model ${model}`, links.parsed_bonds)'>3D Display</button></td> -->
              <td><a v-if="links.PDB" v-bind:href="links.PDB.PDB">PDB File</a></td>
              <td>
                <a target="_blank" v-bind:href="links.Results.XML">XML File</a>
                <br>
                <a target="_blank" v-bind:href="links.Results.TXT">TXT File</a>
              </td>
              <td>
                <a target="_blank" v-if="links.Logs" v-bind:href="links.Logs.MSMS">MSMS</a>
                <br>
                <a target="_blank" v-if="links.Logs" v-bind:href="links.Logs.HBPlus">HBPlus</a>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
    <div class="alert alert-danger" v-if="!result">
      Fetching results
    </div>
  </div>
</template>

<script>
import vueSlider from 'vue-slider-component';
import {ButtonClose, BCollapse} from 'bootstrap-vue';
import attributeCard from './card.vue';
import attributeCard2 from './card2';
import { Viewer } from 'molstar/build/viewer/molstar';
import 'molstar/build/viewer/molstar.css';
import molviewer from './molstar-viewer';
// import html2canvas from 'html2canvas';
// import('sigma/build/plugins/sigma.renderers.snapshot.min');

export default {
  name: 'Result',
  components: {
    ButtonClose,
    BCollapse,
    vueSlider,
    attributeCard,
    attributeCard2,
    molviewer,
  },
  data: () => ({
    result: '',
    display_label: '',
    display_graph: false,
    url_3D: false,
    res_labels: [],
    draw_labels: true,
    selected_edges: [],
    selected_info: '',
    interacting_res: false,
    chain1: '',
    chain2: '',
    default_colors: null,
    viewer: false,
    graph: null,
    pdbFile: '',
    options: '',
    selected_chain: null,
    added_cards: [],
    dist_filter: [
      0,
      15
    ],
    all_edges: {
      HYDPHB: {id: 'HYDPHB', name: 'Hydrophobic', color: '#808080', min: '1', max: '5', value: '4'},
      ELCSTA: {id: 'ELCSTA', name: 'Electrostatic', color: '#008800', min: '0', max: '8', value: '5'},
      HYBOND: {id: 'HYBOND', name: 'Hydrogen Bond', color: '#880000', min: '1', max: '5', value: '3.5'},
      SLTBDG: {id: 'SLTBDG', name: 'Salt Bridge', color: '#6e0088', min: '0', max: '5', value: '3.5'},
    },
    amino_acid: {
      ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C', GLN: 'Q', GLU: 'E', // eslint-disable-line
      GLY: 'G', HIS: 'H', ILE: 'I', LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', // eslint-disable-line
      PRO: 'P', PYL: 'O', SEC: 'U', SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', // eslint-disable-line
      VAL: 'V',
    },
    open_xml: {},
    s: undefined,
    hover_sphere: null,
    hover_style: null,
    last_selected_node: null,
  }),
  mounted: function () {
    let mol_js = document.createElement('script');
    mol_js.setAttribute('src', 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js');
    document.head.appendChild(mol_js);
    this.selected_edges = Object.keys(this.all_edges);
    this.$http.get(this.$server_url + '/results/' + this.$route.params.job_id).then(function (response) {
      // console.log(response);
      // console.log(response.body.models);
      if (jQuery.isEmptyObject(response.body.models)) {
        console.error('Response models are empty objects');
        alert('Job not finished, fetched job does not contain any models');
      } else {
        this.result = response.body;
      }
    }, function (response) {
      console.error(response);
      alert('File job fetch failed. Check your browser console for details');
    });
  },
  methods: {
    initViewer: function (target) {
      this.molstar_viewer = new Viewer(target, {
        layoutIsExpanded: false,
        layoutShowControls: true,
        layoutShowRemoteState: false,
        layoutShowSequence: true,
        layoutShowLog: false,
        layoutShowLeftPanel: false,
        viewportShowExpand: true,
        viewportShowSelectionMode: false,
        viewportShowAnimation: false,
      });
      this.molstar_viewer.loadStructureFromUrl(this.pdbFile, 'pdb');
      console.log(this.molstar_viewer);
    },
    open3D: function (pdb_url, chain1, chain2, parsed_xml, _graph) {
      let graph = _graph || this.extractParsedXML(this.open_xml, this.selected_edges);
      let color_chart = this.all_edges;
      let amino_acid = this.amino_acid;
      this.default_colors = {[chain1]: 'cyan', [chain2]: 'pink'};
      let element = $('#container-01');
      let config = {backgroundColor: 'white'};
      this.$el.querySelector('#container-01').style.display = 'block';
      if (!this.viewer) {
        this.viewer = $3Dmol.createViewer(element, config); // eslint-disable-line
      }
      let viewer = this.viewer;
      let renderStyles = this.renderStyles;
      if (this.added_cards.length === 0) {
        this.added_cards.push({chain: chain1,
          color: 'cyan',
          opacity: null,
          type: 'model',
          model_type: 'cartoon',
          render: false,
          removed: false,
          default: true,
          added_attributes: []});
        this.added_cards.push({chain: chain2,
          color: 'pink',
          opacity: null,
          type: 'model',
          model_type: 'cartoon',
          render: false,
          default: true,
          removed: false,
          added_attributes: []});
      }
      this.makeModel(pdb_url, chain1, chain2, graph,
        color_chart, amino_acid, viewer, this.default_colors,
        function () {
          renderStyles({render: true, removed: false}, true);
        });
      // this.initViewer('target-box2');
    },
    makeModel: function (pdb_url, chain1, chain2, graph, color_chart, amino_acid, _viewer, default_colors, _callback) {
      let res_labels = [];
      $(function () {
        let viewer = _viewer;
        viewer.clear();
        jQuery.ajax(pdb_url, {
          success: function (data) {
            let v = viewer;
            v.addModel( data, 'pdb', {keepH: true});                        /* load data */ // eslint-disable-line
            // v.setStyle({chain: chain1}, {cartoon: {color: default_colors[chain1], opacity: 1}});  /* style all atoms */// eslint-disable-line
            // v.setStyle({chain: chain2}, {cartoon: {color: default_colors[chain2], opacity: 1}}); // eslint-disable-line
            for (let i = 0; i < graph.nodes.length; i++) {
              let atom = graph.nodes[i].id;
              let atom_chain = atom.substring(0, 1);
              let atom_id = atom.substring(1, atom.length);
              let label = v.addResLabels({resi: atom_id, chain: atom_chain}, {backgroundOpacity: 0.3});
              res_labels.push(([label[0], [atom_id, atom_chain]]));
              // v.setStyle({resi: atom_id, chain: atom_chain}, {cartoon: {color: default_colors[atom_chain], opacity: 1}, stick: {color: default_colors[atom_chain]}});
              // v.addSphere({center: {resi: atom_id, chain: atom_chain}, radius: 0.5, color: 'green'});
            }
            // Adding the interactions to the 3d viewer
            for (let i = 0; i < graph.edges.length; i++) {
              let bond = graph.edges[i];
              let source = bond.source;
              let target = bond.target;
              let bond_color = color_chart[bond.type].color;
              v.addCylinder({start: {resi: source.substring(1, source.length), chain: source.substring(0, 1), atom: bond.source_atom},
                end: {resi: target.substring(1, target.length), chain: target.substring(0, 1), atom: bond.target_atom},
                radius: 0.05,
                fromCap: 2,
                toCap: 2,
                dashed: true,
                color: bond_color,
                opacity: 1});
              v.setClickable({resi: source.substring(1, source.length), chain: source.substring(0, 1), atom: bond.source_atom}, true, function (atom, viewer, event, container) {
                if (!atom.label) {
                  let res_name = atom.resn in amino_acid ? amino_acid[atom.resn] : atom.resn;
                  atom.label = viewer.addLabel(res_name + ':' + atom.atom, {position: atom, backgroundColor: atom.style.stick.color, backgroundOpacity: 0.5, fontColor: 'black'});
                } else {
                  viewer.removeLabel(atom.label);
                  delete atom.label;
                }
              });
              v.setClickable({resi: target.substring(1, target.length), chain: target.substring(0, 1), atom: bond.target_atom}, true, function (atom, viewer, event, container) {
                if (!atom.label) {
                  let res_name = atom.resn in amino_acid ? amino_acid[atom.resn] : atom.resn;
                  atom.label = viewer.addLabel(res_name + ':' + atom.atom, {position: atom, backgroundColor: atom.style.stick.color, backgroundOpacity: 0.5, fontColor: 'black'});
                } else {
                  viewer.removeLabel(atom.label);
                  delete atom.label;
                }
              });
            }
            v.setHoverable({}, true, function (atom, viewer, event, container) {
              if (!atom.label) {
                atom.label = viewer.addLabel(atom.resn + atom.rescode + ':' + atom.atom, {position: atom, backgroundColor: 'mintcream', backgroundOpacity: 0.75, fontColor: 'black'});
              }
              // let style_options = {cartoon: {color: this.hover_color, opacity: 1}};
              this.hover_style = atom.style;
              // console.log(atom)
              viewer.setStyle({resi: atom.resi, chain: atom.chain}, //  sets the style for the residue whose's atom is selected by hover
                {cartoon: {hidden: true},
                  stick: {colorscheme: 'default'}});
              viewer.setStyle({resi: atom.resi, chain: atom.chain, elem: 'H'}, {stick: {color: 'black', hidden: true}}); //  hides hydrogen
              let sphere = viewer.addSphere({center: {x: atom.x, y: atom.y, z: atom.z}, radius: 1, color: atom.color, wireframe: true}); //  adds a sphere to indicate selected atom
              // console.log(sphere);
              this.hover_sphere = sphere;
              v.render();
            },
            function (atom) {
              if (atom.label) {
                // console.log(atom.label);
                // console.log(atom);
                if (atom.label.stylespec.backgroundColor === 'mintcream') {
                  viewer.removeLabel(atom.label);
                  delete atom.label;
                }
              }
              if (this.hover_sphere != null) {
                viewer.removeShape(this.hover_sphere);
                viewer.setStyle({resi: atom.resi, chain: atom.chain}, this.hover_style);
                viewer.setStyle({resi: atom.resi, chain: atom.chain, elem: 'H'}, {stick: {color: 'black', hidden: true}}); //  hides hydrogen
                v.render();
                // console.log(this.hover_sphere);
              }
            }
            );
            v.setHoverDuration(50);
            v.zoomTo();                              /* set camera */  // eslint-disable-line
            v.render();                                      /* render scene */ // eslint-disable-line
            v.zoom(1.5, 1000);                               /* slight zoom */ // eslint-disable-line
            _callback();
          },
          error: function (hdr, status, err) {
            console.error('Failed to load PDB ' + pdb_url + ': ' + err);
          },
        });
        // console.log(viewer);
      });
      this.res_labels = res_labels;
      this.draw_labels = true;
    },
    parsepdb: function (pdb) {
      let residues = [];
      let bonds = [];
      let min_chain_idx = {};
      let offset = 0;
      pdb.split('\n').forEach((line) => {
        let chain;
        let aa;
        let index;
        if (line.slice(0, 4) === 'ATOM') {
          aa = line.substring(17, 21).trim();
          chain = line.substring(21, 22).trim();
          index = line.substring(22, 26).trim();
          if (!min_chain_idx[chain]) {
            min_chain_idx[chain] = parseInt(index);
          }
          let resid = chain + index;
          if (!residues.length || residues[residues.length - 1].id !== resid) {
            if (residues.length && residues[residues.length - 1].id[0] === chain) {
              bonds.push({
                id: bonds.length,
                label: chain + ' backbone',
                source: residues[residues.length - 1].id,
                target: resid,
                color: '#666',
                size: 0.1,
              });
            } else {
              offset = residues.length
            }
            residues.push({
              id: resid,
              label: `${resid}: ${aa}`,
              x: 2 * (parseInt(index) - min_chain_idx[chain]),
              y: offset,
              color: '#666',
              size: 0.1,
            });
          }
        }
      });
      return {'nodes': residues, 'edges': bonds}
    },
    extractParsedXML: function (xml_json, bond_types) {
      let new_nodes = [];
      let new_edges = [];
      let node_ids = new Set();
      let source_indices = [];
      let target_indices = [];
      // let interacting_residues = [];
      JSON.parse(xml_json).BONDS.BOND.forEach((bond, index) => {
        if (!bond_types.includes(bond.type._text)) { return }
        var target = 0;
        var target_atom = 0;
        var source_residue = 0;
        var target_residue = 0;
        var target_pct = 0;
        var target_area = 0;
        var source = 0;
        var source_atom = 0;
        var source_index = 0;
        var source_pct = 0;
        var source_area = 0;

        var target_index = 0;
        if (bond.RESIDUE[0].chain._text === this.chain1) {
          source_index = bond.RESIDUE[0]._attributes.index;
          target_index = bond.RESIDUE[1]._attributes.index;
          source = bond.RESIDUE[0].chain._text + source_index;
          source_atom = bond.RESIDUE[0].atom._text;
          target = bond.RESIDUE[1].chain._text + target_index;
          target_atom = bond.RESIDUE[1].atom._text;
          source_residue = bond.RESIDUE[0].name._text;
          target_residue = bond.RESIDUE[1].name._text;
          source_area = bond.RESIDUE[0]._attributes.area;
          target_area = bond.RESIDUE[1]._attributes.area;
          source_pct = bond.RESIDUE[0]._attributes.pct;
          target_pct = bond.RESIDUE[1]._attributes.pct;
        } else {
          source_index = bond.RESIDUE[1]._attributes.index;
          target_index = bond.RESIDUE[0]._attributes.index;
          source = bond.RESIDUE[1].chain._text + source_index;
          source_atom = bond.RESIDUE[1].atom._text;
          target = bond.RESIDUE[0].chain._text + target_index;
          target_atom = bond.RESIDUE[0].atom._text;
          source_residue = bond.RESIDUE[1].name._text;
          target_residue = bond.RESIDUE[0].name._text;
          source_area = bond.RESIDUE[1]._attributes.area;
          target_area = bond.RESIDUE[0]._attributes.area;
          source_pct = bond.RESIDUE[1]._attributes.pct;
          target_pct = bond.RESIDUE[0]._attributes.pct;
        }
        // console.log(bond.RESIDUE[0])
        let s_res_name = source_residue in this.amino_acid ? this.amino_acid[source_residue] : source_residue;
        let t_res_name = target_residue in this.amino_acid ? this.amino_acid[target_residue] : target_residue;
        if (!node_ids.has(source)) {
          if (!source_indices.includes(source_index)) {
            source_indices.push(source_index);
          }
          new_nodes.push({
            id: source,
            label: `${source}: ${source_residue}`,
            x: 0,
            y: 0,
            size: 1,
            color: 'cyan',
            original_color: 'cyan',
            index: source_index,
            direction: 'up',
            sigma_label: `${s_res_name}${source.substr(1)} ${source.charAt(0)}`,
            area: source_area,
            pct: source_pct
          });
          node_ids.add(source)
          // interacting_residues.push({
          //   id: target,
          //   atoms: []
          // });
        }
        if (!node_ids.has(target)) {
          if (!target_indices.includes(target_index)) {
            target_indices.push(target_index);
          }
          new_nodes.push({
            id: target,
            label: `${target}: ${target_residue}`,
            x: 0,
            y: 40,
            size: 1,
            color: 'pink',
            original_color: 'pink',
            index: target_index,
            direction: 'down',
            sigma_label: `${t_res_name}${target.substr(1)} ${target.charAt(0)}`,
            area: target_area,
            pct: target_pct
          });
          node_ids.add(target)
          // interacting_residues.push({
          //   id: target,
          //   atoms: []
          // });
          // console.log(JSON.parse(JSON.stringify(interacting_residues)))
        }
        if (parseFloat(bond.dist._text) < this.dist_filter[0]) { return }
        if (parseFloat(bond.dist._text) > this.dist_filter[1]) { return }
        new_edges.push({
          id: `Bond ${index + 1}`,
          label: this.all_edges[bond.type._text].name,
          size: 1 / parseFloat(bond.dist._text),
          source: source,
          source_atom: source_atom,
          source_label: `${s_res_name}${source.substr(1)}.${source.charAt(0)}`,
          source_area: source_area,
          source_pct: source_pct,
          target: target,
          target_label: `${t_res_name}${target.substr(1)}.${target.charAt(0)}`,
          target_atom: target_atom,
          target_area: target_area,
          target_pct: target_pct,
          color: this.all_edges[bond.type._text].color,
          type: bond.type._text,
          dist: bond.dist._text,
          added: [],
        })
        // for (let i = 0; i < interacting_residues.length; i++) {
        //   let res = interacting_residues[i]
        //   if (res.id === source) {
        //     if (!(source_atom in res.atoms.map(({id}) => id))) {
        //       res.atoms.push({
        //         id: source_atom,
        //         area: source_area,
        //         pct: source_pct
        //       })
        //     }
        //   } else if (res.id === target) {
        //     if (!(source_atom in res.atoms.map(({id}) => id))) {
        //       res.atoms.push({
        //         id: target_atom,
        //         area: target_area,
        //         pct: target_pct
        //       })
        //     }
        //   }
        // }
      });
      source_indices.sort((a, b) => a - b);
      target_indices.sort((a, b) => a - b);
      let source_multiplier = 5;
      let target_multiplier = 5;
      if (source_indices.length >= target_indices.length) {
        target_multiplier = 5 * (source_indices.length / target_indices.length);
      } else {
        source_multiplier = 5 * (target_indices.length / source_indices.length);
      }
      for (const node of new_nodes) {
        if (node.y === 0) {
          node.x = source_multiplier * source_indices.indexOf(node.index);
        } else {
          node.x = target_multiplier * target_indices.indexOf(node.index) + 1; // If you make two nodes perfectly aligned such that an edge between the two is a perpendicular line then sigma.js overEdge doesn't work on the edge
        }
      }
      // this.interacting_res = interacting_residues
      // console.log(interacting_residues)
      return {'nodes': new_nodes, 'edges': new_edges}
    },
    closeDisplay: function () {
      // this.display_label = '';
      this.url_3D = false;
      // this.display_graph = false;
      this.s = undefined;
    },
    open2D: function (pdbFile, parsed_xml, label, chain1, chain2) {
      this.chain1 = chain1;
      this.chain2 = chain2;
      this.options = [
        { id: 0, value: null, text: 'Select a chain' },
        { id: 1, value: chain1, text: 'Chain ' + chain1 },
        { id: 2, value: chain2, text: 'Chain ' + chain2 }];
      this.display_label = label;
      this.display_graph = true;
      this.open_xml = parsed_xml;
      this.pdbFile = pdbFile;
      this.url_3D = `https://3dmol.csb.pitt.edu/viewer.html?url=${pdbFile}
      &select=chain:${chain1}&style=cartoon:color~green
      &select=chain:${chain2}&style=cartoon:color~yellow;stick`;
      if (this.viewer) {
        this.viewer.clear();
      }
      if (!this.s) {
        // Instantiate sigma, use SetTimeout to give Vue a chance to load the container
        setTimeout(() => {
          this.s = new sigma({ // eslint-disable-line
            renderer: {
              // id: 'screenshot',
              container: document.getElementById('graph-container'),
              type: 'canvas'
            },
            settings: {
              drawLabels: true,
              maxNodeSize: 5,
              minEdgeSize: 0.2,
              maxEdgeSize: 2,
              enableEdgeHovering: true,
              edgeHoverSizeRatio: 2,
              edgeHoverExtremities: true,
              sideMargin: 5,
              singleHover: true,
              labelAlignment: 'top',
              defaultLabelAlignment: 'top',
              labelThreshold: 0,
              zoomingRatio: 1
            }
          });
          this.s.bind('overNode', e => {
            this.$el.querySelector('#more-info').innerHTML = `<span> Residue: ${e.data.node.label}, Area: ${e.data.node.area}, Percent: ${e.data.node.pct}</span>`;
            this.$el.querySelector('#related-info').innerHTML = '';
          });
          this.s.bind('overEdge', e => {
            const edge = e.data.edge;
            // console.log(e)
            this.$el.querySelector('#related-info').innerHTML = '<h5>Interactions</h5>';
            let currentBond = `<span style="color:${edge.color}">${edge.source_label}:${edge.source_atom}<-${edge.dist}->${edge.target_label}:${edge.target_atom}</span>`;
            this.$el.querySelector('#related-info').innerHTML += currentBond + '<br>';
            for (const id of edge.added) {
              let related_edge = this.s.renderers[0].edgesOnScreen.find(x => x.id === id);
              if (related_edge) {
                let related_info = `<span style="color:${related_edge.color}">${related_edge.source_label}:${related_edge.source_atom}<-${related_edge.dist}->${related_edge.target_label}:${related_edge.target_atom}</span>`;
                this.$el.querySelector('#related-info').innerHTML += related_info + '<br>';
              }
            }
            // this.selected_info = `ID: ${edge.id} Type: ${edge.label} Distance: ${edge.dist}`;
            this.$el.querySelector('#more-info').innerHTML = `<span> Residue: ${e.data.edge.source_label}, Area: ${e.data.edge.source_area}, Percent: ${e.data.edge.source_pct}</span>`;
            this.$el.querySelector('#more-info').innerHTML += '<br>';
            this.$el.querySelector('#more-info').innerHTML += `<span> Residue: ${e.data.edge.target_label}, Area: ${e.data.edge.target_area}, Percent: ${e.data.edge.target_pct}</span>`;
          });
          this.s.bind('clickNode', e => {
            const node = e.data.node;
            if (!node.selected) {
              this.$refs.molviewer.focusOn(node.id);
              node.selected = true;
              node.color = 'green';
              if (this.last_selected_node) {
                this.last_selected_node.selected = false;
                this.last_selected_node.color = this.last_selected_node.original_color;
              }
              this.last_selected_node = node;
            } else {
              node.selected = false;
              node.color = node.original_color;
              this.last_selected_node = null;
            };
            // console.log(node);
            this.s.refresh();
          });
          this.s.settings({
            drawLabels: true,
            // labelThreshold: 0
          });
          this.renderGraph();
        }, 100);
      } else {
        this.renderGraph();
      }
      // this.open3D(pdbFile, chain1, chain2, parsed_xml);
    },
    renderGraph: function () {
      console.log('starting render');
      if (!this.s) { return }
      let graph = this.extractParsedXML(this.open_xml, this.selected_edges);
      let graph_filtered = {'nodes': [], 'edges': []};
      let relevant_nodes = new Set()
      for (let i = 0; i < graph.edges.length; i++) {
        let bond = graph.edges[i];
        // console.log(bond.dist);
        // console.log(this.all_edges[bond.type].value);
        // filters out interactions that are greater than the limit set by the slider
        if (bond.dist <= this.all_edges[bond.type].value) {
          // console.log(bond);
          let id1 = bond.id;
          let source = bond.source;
          let target = bond.target;
          for (let x = 0; x < graph.edges.length; x++) {
            let bond2 = graph.edges[x];
            let id2 = bond2.id;
            let source2 = bond2.source;
            let target2 = bond2.target;
            if (id2 !== id1 && (((source === source2) && (target === target2)) || ((source === target2) && (target === source2)))) {
              if (!bond.added.includes(id2)) {
                bond.added.push(id2);
                bond2.added.push(id1);
              }
            }
          }
          graph_filtered.edges.push(bond);
          relevant_nodes.add(bond.source);
          relevant_nodes.add(bond.target);
        }
      }
      for (let i = 0; i < graph.nodes.length; i++) {
        let node = graph.nodes[i];
        if (relevant_nodes.has(node.id)) {
          graph_filtered['nodes'].push(node);
        }
      }

      this.s.graph.clear();
      this.s.graph.read(graph_filtered);
      this.s.refresh();
      this.graph = graph_filtered;
      this.open3D(this.pdbFile, this.chain1, this.chain2, this.open_xml, graph_filtered);
    },
    savePic: function () {
      if (confirm('Save image of 3D model?')) {
        var filename = '3dmol.png';
        var text = this.viewer.pngURI();
        var ImgData = text;
        var link = document.createElement('a');
        link.href = ImgData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    savePic2D: function () {
      if (confirm('Save image of 2D interaction map?')) {
        var canvas = document.getElementsByClassName('sigma-scene')[0];
        const context = canvas.getContext('2d');
        context.save();
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
        console.log('LOGGING...');
        console.log(canvas);
        var filename = '2dgraph.png';
        var Img = canvas.toDataURL();
        var link = document.createElement('a');
        link.href = Img;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    },
    hideResLabels: function () {
      if (this.draw_labels) {
        for (const label of this.res_labels) {
          this.viewer.removeLabel(label[0]);
        }
        this.draw_labels = false;
      } else {
        let new_res_labels = [];
        for (const label of this.res_labels) {
          let new_label = this.viewer.addResLabels({resi: label[1][0], chain: label[1][1]}, {backgroundOpacity: 0.3});
          new_res_labels.push(([new_label[0], label[1]]));
        }
        this.draw_labels = true;
        this.res_labels = new_res_labels;
      }
      // console.log(this.viewer);
      // console.log(this.res_labels);
    },
    addChainSurface: function (chain, opacity, color_scheme, color) {
      if (chain != null && opacity != null) {
        if (color_scheme !== 'None') {
          return this.viewer.addSurface($3Dmol.SurfaceType.VDW, {opacity: opacity, colorscheme: color_scheme, color: color}, {chain: chain}, this.addSurfaceTag()); // eslint-disable-line
        } else {
          return this.viewer.addSurface($3Dmol.SurfaceType.VDW, {opacity: opacity, color: color}, {chain: chain}, this.addSurfaceTag()); // eslint-disable-line
        }
      }
    },
    addModelStyle: function (model_type, chain, style_dict = null, def = false) {
      if (chain != null && model_type != null) {
        let style_options = {};
        if (style_dict !== null) {
          style_options[model_type] = style_dict;
        }
        if (def) {
          style_options = {cartoon: {color: this.default_colors[chain], opacity: 1}};
        }
        this.viewer.setStyle({chain: chain}, style_options);
        style_options['stick'] = {color: this.default_colors[chain]};
        for (let i = 0; i < this.graph.nodes.length; i++) {
          let atom = this.graph.nodes[i].id;
          let atom_chain = atom.substring(0, 1);
          let atom_id = atom.substring(1, atom.length);
          if (atom_chain === chain) {
            this.viewer.setStyle({resi: atom_id, chain: atom_chain}, style_options);
          }
        }
        this.viewer.setStyle({elem: 'H'}, {stick: {color: 'black', hidden: true}}); //  hides hydrogen
      }
    },
    addSurfaceTag: function () {
      // alert('hi');
    },
    addSurfaceCard: function () {
      this.added_cards.push({chain: null,
        color: null,
        opacity: null,
        color_scheme: 'default',
        type: 'surface',
        render: false,
        removed: false,
        added_attributes: []});
      // this.added_cards = this.added_cards.filter(word => word['removed'] === false);
    },
    addStyleCard: function () {
      this.added_cards.push({chain: null,
        color: 'magenta',
        opacity: null,
        type: 'model',
        model_type: null,
        render: false,
        removed: false,
        added_attributes: []});
      // this.added_cards = this.added_cards.filter(word => word['removed'] === false);
    },
    removeSurface: function (surface) {
      this.viewer.removeSurface(surface);
    },
    renderStyles: function (card, render_surfaces) {
      if (card['render'] || card['removed']) {
        this.addModelStyle('cartoon', this.chain1, null, true);
        this.addModelStyle('cartoon', this.chain2, null, true);
        this.added_cards.forEach((card, index) => {
          if (!card['removed'] && card['render']) {
            if (card['type'] === 'model') {
              let style_dict = this.convertToDict(card['added_attributes']);
              // console.log('final style dict');
              // console.log(style_dict);
              this.addModelStyle(card['model_type'], card['chain'], style_dict);
            }
            if (render_surfaces && card['type'] === 'surface') {
              this.addChainSurface(card['chain'], card['opacity'], card['color_scheme'], card['color']);
            }
          }
        })
        this.viewer.render();
      }
    },
    convertToDict: function (added_attributes) {
      // console.log('added_attributes');
      // console.log(added_attributes);
      let style_dict = {};
      added_attributes.forEach((data, index) => {
        // console.log(data.value, data.valid_values, data.selected_attribute, data.discrete);
        if (data.value !== null && data.selected_attribute !== null) {
          style_dict[data.selected_attribute] = data.value;
        }
        // console.log('da style dict');
        // console.log(style_dict)
      });
      return style_dict;
    }

  }
}
</script>

<style scoped>
  .display-container {
    height: 80vh;
    width: 100%;
    margin: auto;
  }
  #color-table {
    float: none;
    /* display: block; */
    vertical-align: bottom;
  }
  .container{
    min-width: 97%;
  }
  .col-10{
    max-width: calc(100% - 310px);
    padding: 0px;
    height: 80vh;
  }
  .col-2{
    min-width: 310px;
    height: 80vh;
    padding: 5px;
    display: flex;
    flex-direction: column;
  }
  .parent{
    display: grid;
    grid-template-columns: 1fr 1fr 0.4fr;
  }
  .child {
    padding: 1.1px;
  }
  #child1 {
    text-align: center;
  }
  .parent2{
    padding: 10px;
  }
  .mol-container {
    width: 100%;
    height: 100%;
    position: relative;
  }
  #target-box{
    margin-top: 30px;
  }
  .card-body {
    padding: 5px;
    margin: 0px;
  }
  .card {
    display: block;
  }
  #undefined {
    max-width: 100%;
  }
  #target-box2, #target-box3{
    margin-top: 30px;
    /* min-height: 80vh; */
  }
  #molstar-block{
    min-height: 80vh;
  }
  #more-info, #related-info, #added-surfaces, #added-surfaces2 {
    overflow-y: scroll;
    min-width: 100%;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  #more-info {
    max-height: 15%;
  }
  #more-info::-webkit-scrollbar, #more-options::-webkit-scrollbar, #related-info::-webkit-scrollbar, #added-surfaces::-webkit-scrollbar, #added-surfaces2::-webkit-scrollbar{ /* WebKit */
    width: 0;
    height: 0;
  }
</style>
