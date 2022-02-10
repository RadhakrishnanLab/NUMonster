/* eslint-disable */

import 'molstar/lib/mol-util/polyfill';
// import {PluginConfig} from 'molstar/lib/mol-plugin/config';
// import {BuiltInTrajectoryFormat} from 'molstar/lib/mol-plugin-state/formats/trajectory';
import {
  createStructureRepresentationParams,
  // StructureRepresentationBuiltInProps
} from 'molstar/lib/mol-plugin-state/helpers/structure-representation-params';
import {StateTransforms} from 'molstar/lib/mol-plugin-state/transforms';
import {PluginCommands} from 'molstar/lib/mol-plugin/commands';
import { InteractionsProvider } from 'molstar/lib/mol-model-props/computed/interactions';
// import {PluginUIContext} from 'molstar/lib/mol-plugin-ui/context';
import {
  DefaultPluginUISpec,
  // PluginUISpec
} from 'molstar/lib/mol-plugin-ui/spec';
import {createPlugin} from 'molstar/lib/mol-plugin-ui';
import {Color} from 'molstar/lib/mol-util/color';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { TrajectoryFromSDF } from 'molstar/lib/mol-plugin-state/transforms/model';
import { ColorNames } from 'molstar/lib/mol-util/color/names'
import { ColorListNames, ColorListOptions } from 'molstar/lib/mol-util/color/lists';

// type RepresentationParams = {
//   type: "ball-and-stick" | "cartoon" | "putty",
//   coloring: "uniform" | "element-symbol",
//   uniformColor: {r: number, g: number, b: number}
// }

export class MolstarDemoViewer {
  // plugin: PluginUIContext;

  constructor (element) {
    const spec = {
      ...DefaultPluginUISpec(),
      layout: {
        initial: {
          controlsDisplay: 'reactive',
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowRemoteState: false,
          layoutShowSequence: true,
          layoutShowLog: false,
          layoutShowLeftPanel: true,
          regionState: {
            bottom: 'full',
            left: 'collapsed',
            right: 'full',
            top: 'full',
          },
          viewportShowExpand: true,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
        },
      },
      components: {
        remoteState: 'none'
      },
      config: [
      ]
    }
    this.plugin = createPlugin(element, spec);
    this.propsA = null;
    this.propsB = null;
    this.structureA = null;
    this.structureB = null;
    this.structureDefault = null;
    this.viewer_data = {};
    this.defaultProps = null;
    this.colorList = ColorListNames;
    this.typeParams = {
      'cartoon' : {visuals: ['polymer-trace', 'polymer-gap', 'nucleotide-block']},
      'no_no_nucleotide' : {visuals: ['polymer-trace', 'polymer-gap']},
      'putty' : {visuals: ['polymer-tube']}
    };
    this.cards = null;
  }

  async loadStructureFromData (url, format, reprParams, cards) {
    this.cards = cards;
    await this.plugin.clear();
    console.log('Loading...');
    this.plugin.behaviors.layout.leftPanelTabName.next('data');
    const data = await this.plugin.builders.data.download({url}, { state: { isGhost: true } });
    const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);
    const model = await this.plugin.builders.structure.createModel(trajectory);
    if (!model) return;
    const structure = await this.plugin.builders.structure.createStructure(model);
    this.structureDefault = structure;

    const {type, coloring, uniformColor} = reprParams;
    let props = {
      type: type,
      // color: coloring,
      size: 'uniform',
      sizeParams: {value: 2.0}
    }
    if (coloring === 'uniform') {
      props.colorParams = {value: Color.fromRgb(uniformColor.r, uniformColor.g, uniformColor.b)}
    }
    if (type === 'cartoon') {
      props.typeParams = {visuals: ['polymer-trace', 'polymer-gap', 'nucleotide-block']}
    }
    this.defaultProps = props;

    console.log('begin');
    if (structure) {
      cards.forEach( async card => {
        let card_props = JSON.parse(JSON.stringify(props));
        card_props.color = 'uniform';
        card_props.colorParams = {value: ColorNames[card.color]};
        const card_query = await this.queryChain(card.chain);
        const card_component = await this.createChainComponent(structure, card_query, 'Chain' + card.chain)
        if (card_component) { 
          let card_structure = await this.addStructRepr(card_component, card_props);
          this.viewer_data[card.chain] = {'query': card_query,
          'props' : card_props,
          'component' : card_component,
          'structure' : card_structure
          }
        } 
      });
    }
  }

  async updateMoleculeRepresentation (reprParams) {
    // eslint-disable-next-line no-unused-vars
    const {type, coloring, uniformColor} = reprParams;
    let props = {
      type: type,
      // color: coloring,
      size: 'uniform',
      sizeParams: {value: 2.0}
    }
    // if (coloring === 'uniform') {
    //   props.colorParams = {value: Color.fromRgb(uniformColor.r, uniformColor.g, uniformColor.b)}
    // }
    console.log(type);
    if (type === 'cartoon') {
      props.typeParams = {visuals: ['polymer-trace', 'polymer-gap', 'nucleotide-block']}
    }
    if (type === 'no_nucleotide') {
      props.typeParams = {visuals: ['polymer-trace', 'polymer-gap']}
      props.type = 'cartoon';
      console.log('here');
    }
    if (type === 'putty') {
      props.typeParams = {visuals: ['polymer-tube']}
    }
    console.log('there');
    const newRepresenation = createStructureRepresentationParams(this.plugin, void 0, props);
    console.log(`Trying to update structure 3D Representation to ${type}`)
    console.log(InteractionsProvider);
    const data = this.plugin.managers.structure.hierarchy;
    console.log('data');
    console.log(data);
    console.log(this.plugin.state);

    this.cards.forEach ( async card => {
      await this.plugin.build().to(this.viewer_data[card.chain].structure).update(newRepresenation).commit();
    });
    // await this.plugin.build().to(this.structureB).update(newRepresenation).commit();
    // await this.plugin.build().to(this.structureA).update(newRepresenation).commit();
  }

  async toggleControls (isVisible) {
    await PluginCommands.Layout.Update(this.plugin, { state: { showControls: isVisible } });
  }

  async updateA(){
    let color = Object.keys(ColorNames)[Math.floor (Math.random() * 100)];
    console.log(color);
    this.cards[0].color = color;
    this.reloadCards([this.cards[0]])
  }

  async reloadCards (cards) {
    // the cards have changed and it's time to reload those changes
    if (this.structureDefault) {
      cards.forEach( async card => {
        // console.log('reloadCards');
        // console.log(card);
        let card_props = null;
        let card_component = null;
        let card_query = null;
        let exists = card.chain in this.viewer_data;
        if (!exists){
          card_props = JSON.parse(JSON.stringify(this.defaultProps));
          if (card_props) {card_props.color = 'uniform';}
          card_query = this.queryChain(card.chain);
          card_component = await this.createChainComponent(this.structureDefault, card_query, 'Chain' + card.chain).catch(e => {
            console.log(e);
          });
        } else {
          card_props = this.viewer_data[card.chain].props;
          card_props.colorParams = {value: ColorNames[card.color]};
          card_component = this.viewer_data[card.chain].component;
        }
        if (card_component) { 
          let card_structure = null;
          if (exists) {
            card_structure = this.viewer_data[card.chain].structure;
            this.updateStruct(card_structure, card_props);
          } else {
            card_structure = await this.addStructRepr(card_component, card_props);
          }
          this.viewer_data[card.chain] = {'query': card_query,
            'props' : card_props,
            'component' : card_component,
            'structure' : card_structure
          }
        }
      }); 
    }
  }

  // helper functions
  
  queryChain (chainID) {
    // returns the query for the chain
    const query = MS.struct.generator.atomGroups({
      'residue-test': MS.core.rel.eq([MS.ammp("auth_asym_id"), chainID])
    })
    return query;
  }

  async createChainComponent (sourceStructure, query, chainName) {
    /* chainName needs to be unique per component */ 
    const component = this.plugin.builders.structure.tryCreateComponentFromExpression(sourceStructure, query, chainName);
    return component;
  }

  async addStructRepr (component, props) {
    // this visualizes the component created with the properties in props
    const structure = this.plugin.builders.structure.representation.addRepresentation(component, props);
    return structure;
  }

  async updateStruct(struct, props){
    // update a previous struct using props
    this.plugin.build().to(struct).update(createStructureRepresentationParams(this.plugin, void 0, props)).commit();
  }

  dispose () {
    this.plugin.dispose(); //  eslint-disable-line
  }
}
