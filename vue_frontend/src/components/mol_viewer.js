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

// type RepresentationParams = {
//   type: "ball-and-stick" | "cartoon" | "putty",
//   coloring: "uniform" | "element-symbol",
//   uniformColor: {r: number, g: number, b: number}
// }

export class MolstarDemoViewer {
  // plugin: PluginUIContext;
  // currentStructure: any;

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
  }

  async loadStructureFromData (url, format, reprParams) {
    await this.plugin.clear();
    console.log('Loading...');
    this.plugin.behaviors.layout.leftPanelTabName.next('data');

    const data = await this.plugin.builders.data.download({url}, { state: { isGhost: true } });
    const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);
    const model = await this.plugin.builders.structure.createModel(trajectory);
    if (!model) return;
    const structure = await this.plugin.builders.structure.createStructure(model);

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
    const repr = createStructureRepresentationParams(this.plugin, structure.data, props);
    console.log('repr');
    console.log(repr);
    this.currentStructure = await this.plugin.build().to(structure).apply(StateTransforms.Representation.StructureRepresentation3D, repr).commit();

    // create chain A
    const query1 = MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([MS.ammp("auth_asym_id"), 'A'])
    })
    const componentA = await this.plugin.builders.structure.tryCreateComponentFromExpression(structure, query1, `Chain A` /* needs to be unique per component */);
    if (componentA) this.structureA = await this.plugin.builders.structure.representation.addRepresentation(componentA, { type: 'cartoon', color:'uniform', colorParams: {value: Color.fromRgb(202, 0, 0)} });

    // create chain B
    const query2 = MS.struct.generator.atomGroups({
      'residue-test': MS.core.rel.eq([MS.ammp("auth_asym_id"), 'B'])
    })
    const componentB = await this.plugin.builders.structure.tryCreateComponentFromExpression(structure, query2, `Chain B` /* needs to be unique per component */);
    if (componentB) this.structureB = await this.plugin.builders.structure.representation.addRepresentation(componentB, { type: 'cartoon', color:'uniform', colorParams: {value: Color.fromRgb(0, 200, 0)} });
    // this.currentStructure =  [this.structureA, this.structureB];

    console.log('current structs');
    console.log(this.currentStructure);
    console.log(this.structureB);
    console.log(this.plugin.managers.structure.hierarchy.current.structures);
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

    await this.plugin.build().to(this.currentStructure).update(newRepresenation).commit();
  }

  async toggleControls (isVisible) {
    await PluginCommands.Layout.Update(this.plugin, { state: { showControls: isVisible } });
  }

  async updateA(){
    await this.plugin.build().to(this.structureA).update(createStructureRepresentationParams(this.plugin, void 0, { type: 'cartoon', color:'uniform', colorParams: {value: Color.fromRgb(0, 0, 200)}})).commit();
  }

  dispose () {
    this.plugin.dispose(); //  eslint-disable-line
  }
}
