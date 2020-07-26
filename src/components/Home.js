import React, { Component } from 'react';

import * as Blockly from 'blockly/core';

import WorkspaceStats from './WorkspaceStats';
import WorkspaceFunc from './WorkspaceFunc';
import BlocklyWindow from './Blockly/BlocklyWindow';
import CodeViewer from './CodeViewer';

import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

class Home extends Component {

  state = {
    codeOn: false
  }

  componentDidUpdate() {
    /* Resize and reposition all of the workspace chrome (toolbox, trash,
    scrollbars etc.) This should be called when something changes that requires
    recalculating dimensions and positions of the trash, zoom, toolbox, etc.
    (e.g. window resize). */
    const workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
  }

  onChange = () => {
    this.setState({ codeOn: !this.state.codeOn });
  }

  render() {
    return (
      <div>
        <WorkspaceStats />
        <Grid container spacing={2}>
          <Grid item xs={12} md={this.state.codeOn ? 6 : 12} style={{ position: 'relative' }}>
            <FormControlLabel
              style={{ margin: '5px 10px 0 0', position: 'absolute', top: 0, right: 0, zIndex: 1 }}
              control={<Switch checked={this.state.codeOn} onChange={this.onChange} color='primary' />}
              label="Code"
            />
            <BlocklyWindow />
          </Grid>
          {this.state.codeOn ?
            <Grid item xs={12} md={6}>
              <CodeViewer />
            </Grid>
            : null}
        </Grid>
        <WorkspaceFunc />
      </div>
    );
  };
}

export default Home;
