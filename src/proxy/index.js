import React, { Component } from 'react';
import { AwesomeButton } from 'react-awesome-button';
import { startProxy, isPortAvailable, searchForGesher, openFileDialog, searchForXsd, uploadXsd, uploadJson, searchForJson, searchForHttp, uploadHttp, searchForProxyConf, uploadProxyConf, createMarkup, initWatcher } from './logic';
import './index.css'
import { create } from 'domain';

class Proxy extends Component {
  constructor() {
    super();

    this.state = {
      proxyPort: 7171,
      isPortAvailable: null,
      proxyListenerLog: '',
      proxy: null,
      gesherPath: null,
      isGesherAvailable: null,
      isXsdAvailable: null,
      xsdPath: null,
      isJsonAvailable: null,
      jsonPath: null,
      isHttpAvailable: null,
      isProxyConfAvailable: null,
      proxyConfPath: null,
      logs: '',
    };
  }

  componentDidMount() {
    // Searches for an available port
    isPortAvailable(this.state.proxyPort).then(available => {
      this.setState({ isPortAvailable: available });
    });
    
    const nextState = {};

    try {
      // Seek gesher backend directory
      const gesherPath = searchForGesher();
      nextState.isGesherAvailable = true;
      nextState.gesherPath = gesherPath;

      try {
        // After finding the backend, check if xsd already exists
        const xsdPath = searchForXsd(gesherPath);
        nextState.xsdPath = xsdPath;
        nextState.isXsdAvailable = true;
      } catch (e) {
        this.setState({ isXsdAvailable: false })
      }

      try {
        const jsonPath = searchForJson(gesherPath);
        nextState.jsonPath = jsonPath;
        nextState.isJsonAvailable = true;
      } catch (e) {
        this.setState({ isJsonAvailable: false })
      }
      
      try {
        searchForHttp(gesherPath);
        nextState.isHttpAvailable = true;
      } catch (e) {
        this.setState({ isHttpAvailable: false })
      }

      try {
        const proxyConfPath = searchForProxyConf(gesherPath);
        nextState.proxyConfPath = proxyConfPath;
        nextState.isProxyConfAvailable = true;
      } catch (e) {
        this.setState({ isProxyConfAvailable: false })
      }

      try {
        // If here, gesher dir was found
        initWatcher(gesherPath, this.onLogsChanged);
        nextState.logs = createMarkup(gesherPath);
      } catch (e) {
        this.setState({ logs: '' })
      }
    } catch (error) {
      this.setState({ isGesherAvailable: false, gesherPath: error.message })
    }

    this.setState(nextState);
  }

  onPortChange = e => {
    const port = e.target.value;

    this.setState({ proxyPort: port}, () => {
      isPortAvailable(this.state.proxyPort).then(result => {
        this.setState({ isPortAvailable: result });
      })
    })
  }
  
  toggleProxy = () => {
    // If proxy already exists
    if (this.state.proxy) {
      // Terminate child process
      this.state.proxy.kill();
      this.setState({ proxy: null });
      
      return;
    }

    const proxy = startProxy({ 
      port: this.state.port, 
      commands: {'command': 'ls', 'args': ['-l', '/']},
      onStderr: this.onStderr, 
      onClose: this.onProxyClose, 
      onStdout: this.onStdout 
    });

    this.setState({ proxy });
  }

  onStdout = data => {
    this.setState({ proxyListenerLog: this.state.proxyListenerLog + data.toString() + '\n' })
  }

  onStderr = data => {
    this.setState({ proxyListenerLog: this.state.proxyListenerLog + data.toString() + '\n' })
  }

  onProxyClose = code => {
    this.setState({ proxy: null, proxyListenerLog: this.state.proxyListenerLog + `Proxy process exited with the error code: ${code} \n`})    
  }

  getPortStatus = () => {
    switch (this.state.isPortAvailable) {
      case true:
        return <b style={{color: 'green'}}>Yes.</b>;
      case false:
        return (
          <div>
            <b style={{color: 'red'}}>No. Enter a different port:</b>
            <br />
            <input type="number" value={this.state.proxyPort} onChange={this.onPortChange} />
          </div>
        ); 
      default:
        return <b style={{color: 'grey'}}>Waiting...</b>;
    }
  }

  onDirectorySelected = dir => {
    const nextState = {};
    try {
      const gesherPath = searchForGesher(dir[0]);
      nextState.isGesherAvailable = true;
      nextState.gesherPath = gesherPath;

      try {
        // if gesher dir was found, search for existing xsd 
        const xsdPath = searchForXsd(gesherPath);
        nextState.xsdPath = xsdPath;
        nextState.isXsdAvailable = true;
      } catch (e) {
        this.setState({ isXsdAvailable: false });
      }

      try {
        // if gesher dir was found, search for existing json 
        const jsonPath = searchForJson(gesherPath);
        nextState.jsonPath = jsonPath;
        nextState.isJsonAvailable = true;
      } catch (e) {
        this.setState({ isJsonAvailable: false });
      }

      try {
        searchForHttp(gesherPath);
        nextState.isHttpAvailable = true;
      } catch (e) {
        this.setState({ isHttpAvailable: false });
      }

      try {
        const proxyConfPath = searchForProxyConf(gesherPath);
        nextState.proxyConfPath = proxyConfPath;
        nextState.isProxyConfAvailable = true;
      } catch (e) {
        this.setState({ isProxyConfAvailable: false })
      }

      try {
        // If here, gesher dir was found
        initWatcher(gesherPath, this.onLogsChanged);
        nextState.logs = createMarkup(gesherPath);
      } catch (e) {
        this.setState({ logs: '' })
      }
    } catch (error) {
      this.setState({ isGesherAvailable: false, gesherPath: error.message })
    }

    if (Object.keys(nextState).length) {
      this.setState(nextState);    
    }
  }

  // after xsd files have been selected (for upload)
  onXsdSelected = () => {
    // open dialog & copy files to backend path
    uploadXsd(this.state.gesherPath);

    try {
      // if gesher dir was found, search for existing xsd 
      const xsdPath = searchForXsd(this.state.gesherPath);
      this.setState({ xsdPath, isXsdAvailable: true });
    } catch (e) {}
  }

  onJsonSelected = () => {
    uploadJson(this.state.gesherPath);

    try {
      // if gesher dir was found, search for existing xsd 
      const jsonPath = searchForXsd(this.state.gesherPath);
      this.setState({ jsonPath, isJsonAvailable: true });
    } catch (e) {}
  }

  onHttpSelected = () => {
    uploadHttp(this.state.gesherPath);

    try {
      // if gesher dir was found, search for existing xsd 
      searchForHttp(this.state.gesherPath);
      this.setState({ isHttpAvailable: true });
    } catch (e) {}
  }

  onProxyConfSelected = () => {
    uploadProxyConf(this.state.gesherPath);

    try {
      // if gesher dir was found, search for existing xsd 
      const proxyConfPath = searchForProxyConf(this.state.gesherPath);
      this.setState({ proxyConfPath, isProxyConfAvailable: true });
    } catch (e) {}
  }

  getGesherStatus = () => {
    switch (this.state.isGesherAvailable) {
      case true:
        return <b style={{color: 'green'}}>Gesher found.</b>
      case false:
        return (
          <div>
            <b style={{color: 'red'}}>Could not find Gesher.</b>  
            <br />
            <input type="button" value="Select Directory Manually" onClick={openFileDialog(this.onDirectorySelected)}/>
          </div>
        );
      default:
        return <b style={{color: 'grey'}}>Waiting...</b>;
    }
  }

  getXmlValidatorStatus = () => {
    switch (this.state.isXsdAvailable) {
      case true:
        return (
          <div>
            <span style={{color: 'green'}}><b>Found </b><i>proxy.xsd</i><b>.</b></span>
            <br />
            <input type="button" value="Select a different XSD" onClick={this.onXsdSelected}/>
          </div>
        );
      case false:
        return (
          <div>
            <b style={{color: 'red'}}>Could not find <i>proxy.xsd</i>.</b>  
            <br />
            <input type="button" disabled={this.state.isGesherAvaialble} value="Upload XSD" onClick={this.onXsdSelected}/>
          </div>
        );
      default:
        return <b style={{color: 'grey'}}>Waiting for Gesher to be found...</b>;
    }
  }
  
  getJsonValidatorStatus = () => {
    switch (this.state.isJsonAvailable) {
      case true:
        return (
          <div>
            <span style={{color: 'green'}}><b>Found </b><i>json_schema.json</i><b>.</b></span>
            <br />
            <input type="button" value="Select a different JSON" onClick={this.onJsonSelected}/>
          </div>
        );
      case false:
        return (
          <div>
            <span style={{color: 'red'}}><b>Could not find</b> <i>json_schema.json</i>.</span>
            <br />
            <input type="button" disabled={this.state.isGesherAvaialble} value="Upload JSON Schema" onClick={this.onJsonSelected}/>
          </div>
        );
      default:
        return <b style={{color: 'grey'}}>Waiting for Gesher to be found...</b>;
    }
  }
  
  getHttpConfStatus = () => {
    switch (this.state.isHttpAvailable) {
      case true:
        return (
          <div>
            <span style={{color: 'green'}}><b>Found configuration files.</b></span>
            <br />
            <input type="button" value="Select different files" onClick={this.onHttpSelected}/>
          </div>
        );
      case false:
        return (
          <div>
            <b style={{color: 'red'}}>Could not find configuration files.</b>
            <br />
            <input type="button" disabled={this.state.isGesherAvaialble} value="Upload Config Files" onClick={this.onHttpSelected}/>
          </div>
        );
      default:
        return <b style={{color: 'grey'}}>Waiting for Gesher to be found...</b>;
    }
  }

  getProxyConfStatus = () => {
    switch (this.state.isProxyConfAvailable) {
      case true:
        return (
          <div>
            <span style={{color: 'green'}}><b>Found </b><i>proxy_conf.json</i><b>.</b></span>
            <br />
            <input type="button" value="Select a different proxy_conf.json" onClick={this.onProxyConfSelected}/>
          </div>
        );
      case false:
        return (
          <div>
            <span style={{color: 'red'}}><b>Could not find</b> <i>proxy_conf.json</i>.</span>
            <br />
            <input type="button" disabled={this.state.isGesherAvaialble} value="Upload Proxy Configuration" onClick={this.onProxyConfSelected}/>
          </div>
        );
      default:
        return <b style={{color: 'grey'}}>Waiting for Gesher to be found...</b>;
    }
  }

  onLogsChanged = () => {
    if (!this.state.isGesherAvailable) return;

    const newMarkup = createMarkup(this.state.gesherPath);
    console.log(newMarkup)
    this.setState({ logs: newMarkup })
  }

  render() {
    return (
      <div className="Proxy-body">
        {!this.state.proxy && <div className="Proxy-status">
          <table style={{borderSpacing: '1em'}}>
            <tbody>
              <tr>
                <td style={{width: '50%'}}><span>Checking if port <b>{this.state.proxyPort}</b> is available...</span></td>
                <td>{this.getPortStatus()}</td>
              </tr>
              <tr>
                <td><span>Searching for Gesher directory...</span></td>
                <td>{this.getGesherStatus()}</td>
              </tr>
              <tr>
                <td><span>Upload XML Validators</span></td>
                <td>{this.getXmlValidatorStatus()}</td>
              </tr>
              <tr>
                <td><span>Upload JSON Schema</span></td>
                <td>{this.getJsonValidatorStatus()}</td>
              </tr>
              <tr>
                <td><span>Upload HTTP Schema</span></td>
                <td>{this.getHttpConfStatus()}</td>
              </tr>
              <tr>
                <td><span>Upload Proxy Conf</span></td>
                <td>{this.getProxyConfStatus()}</td>
              </tr>
            </tbody>
          </table>
        </div>}
        <div className="Proxy-terminal">
          <AwesomeButton style={{width: '70%'}} type="primary" action={this.toggleProxy} bubbles disabled={!this.state.isGesherAvailable || !this.state.isPortAvailable}>
            {this.state.proxy ? 'Stop Proxy' : 'Start Proxy'}
          </AwesomeButton>
          <br />
          <br />
          <textarea readOnly="readOnly" style={{height: '40vh', width: '90%'}} cols={50} value={this.state.proxyListenerLog} />
        </div>
        <div className="Proxy-logs" style={{border: '1px solid grey', width: this.state.proxy ? '70%' : '32%'}}>
          <h3>Logs</h3>
          {this.state.isGesherAvailable ? <div style={{overflowY: 'scroll', height: '40vh'}} dangerouslySetInnerHTML={this.state.logs} /> : <div>No logs to show yet...</div>}
        </div>
      </div>
    )
  }
}

export default Proxy;
