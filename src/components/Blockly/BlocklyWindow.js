import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { onChangeWorkspace, clearStats } from '../../actions/workspaceActions';
import { De } from './msg/de';
import { En } from './msg/en';
import BlocklyComponent from './BlocklyComponent';
import BlocklySvg from './BlocklySvg';
import * as Blockly from 'blockly/core';
import './blocks/index';
import './generator/index';
import { initialXml } from './initialXml.js';



class BlocklyWindow extends Component {

  constructor(props) {
    super(props);
    this.simpleWorkspace = React.createRef();
    // if (locale === null) {
    //   if (navigator.language === 'de-DE') {
    //     locale = 'de';
    //   } else {
    //     locale = 'en';
    //   }
    // }
    if (this.props.language === 'de') {
      Blockly.setLocale(De);
    } else if (this.props.language === 'en') {
      Blockly.setLocale(En);
    }
  }

  componentDidMount() {
    const workspace = Blockly.getMainWorkspace();
    this.props.onChangeWorkspace({});
    this.props.clearStats();
    workspace.addChangeListener((event) => {
      this.props.onChangeWorkspace(event);
      // switch on that a block is displayed disabled or not depending on whether it is correctly connected
      // for SVG display, a deactivated block in the display is undesirable
      if (this.props.blockDisabled) {
        Blockly.Events.disableOrphans(event);
      }
    });
    Blockly.svgResize(workspace);
  }

  componentDidUpdate(props) {
    const workspace = Blockly.getMainWorkspace();
    var xml = this.props.initialXml;
    // if svg is true, then the update process is done in the BlocklySvg component
    if (props.initialXml !== xml && !this.props.svg) {
      // guarantees that the current xml-code (this.props.initialXml) is rendered
      workspace.clear();
      if (!xml) xml = initialXml;
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
    }
    Blockly.svgResize(workspace);
  }

  render() {
    return (
      <div>
        <BlocklyComponent ref={this.simpleWorkspace}
          style={this.props.svg ? { height: 0 } : this.props.blocklyCSS}
          readOnly={this.props.readOnly !== undefined ? this.props.readOnly : false}
          trashcan={this.props.trashcan !== undefined ? this.props.trashcan : true}
          renderer={this.props.renderer}
          zoom={{ // https://developers.google.com/blockly/guides/configure/web/zoom
            controls: this.props.zoomControls !== undefined ? this.props.zoomControls : true,
            wheel: false,
            startScale: 1,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
          }}
          grid={this.props.grid !== undefined && !this.props.grid ? {} :
            { // https://developers.google.com/blockly/guides/configure/web/grid
              spacing: 20,
              length: 1,
              colour: '#4EAF47', // senseBox-green
              snap: false
            }}
          media={'/media/blockly/'}
          move={this.props.move !== undefined && !this.props.move ? {} :
            { // https://developers.google.com/blockly/guides/configure/web/move
              scrollbars: true,
              drag: true,
              wheel: false
            }}
          initialXml={this.props.initialXml ? this.props.initialXml : initialXml}
        >
        </BlocklyComponent >
        {this.props.svg && this.props.initialXml ? <BlocklySvg initialXml={this.props.initialXml} /> : null}
      </div>
    );
  };
}

BlocklyWindow.propTypes = {
  onChangeWorkspace: PropTypes.func.isRequired,
  clearStats: PropTypes.func.isRequired,
  renderer: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  renderer: state.general.renderer,
  language: state.general.language
});

export default connect(mapStateToProps, { onChangeWorkspace, clearStats })(BlocklyWindow);
