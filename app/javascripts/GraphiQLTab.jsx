import React, {PropTypes} from 'react';

import GraphiQL from 'graphiql';
import {GraphiQLToolbar} from './GraphiQLToolbar.jsx';
import {HeaderEditor} from './HeaderEditor.jsx';

import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Table from 'react-bootstrap/lib/Table';

import {introspectionQuery} from './utility/introspectionQueries';

import {buildClientSchema} from 'graphql';

export class GraphiQLTab extends React.Component {
  static propTypes = {
    tab: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    hasClosed: PropTypes.bool.isRequired,
    onToolbar: PropTypes.func,
    onNameChange: PropTypes.func
  }

  constructor(props) {
    super()

    this.graphiql = null

    this.state = {
      config: props.tab,
      appConfig: props.app,
      header: null,
      headerIdx: null
    }
  }

  runQueryAtCursor() {
    if (this.graphiql)
      this.graphiql._runQueryAtCursor()
  }

  persistState() {
    if (this.graphiql)
      this.graphiql.componentWillUnmount()
  }

  render() {
    if (this.state.config.state.collapsed)
      return this.renderCollapsed()
    else
      return this.renderExpanded()
  }

  renderCollapsed() {
    const tab = this.state.config

    let headers = <span></span>

    if (tab.state.headers.length > 0) {
      const headerList = tab.state.headers.map(h => h.name + ": " + this.headerValue(h)).join(", ")
      headers = <span>&nbsp;&nbsp;&nbsp;<strong>Headers:</strong> {headerList}</span>
    }

    return <div className="graphiql-tool-cont">
      <div className="tab-top" style={{flexDirection: "row"}}>
        <div className="graphiql-collapsed-tab" onClick={this.expand.bind(this)}>
          <strong>URL:</strong> {tab.state.url} {headers}
        </div>
        <div>
          <GraphiQLToolbar hirizontal={true} onToolbar={this.toolbar.bind(this)} hasClosed={this.props.hasClosed} />
        </div>
      </div>

      {this.renderGraphiql(tab)}
    </div>
  }

  renderExpanded() {
    const tab = this.state.config

    const url = <FormControl
      placeholder="GraphQL endpoint URL"
      bsSize="small"
      value={tab.state.url}
      onChange={this.urlChange.bind(this)} />

    let urlInput = url

    if (this.state.appConfig.state.usedUrls.length > 0) {
      const items = this.state.appConfig.state.usedUrls.map(url =>
        <MenuItem key={url} onClick={this.setUrl.bind(this, url)}>{url}</MenuItem>)

      urlInput = <InputGroup>
        {url}
        <DropdownButton componentClass={InputGroup.Button} id="used-url" title="Recent">
          {items}
        </DropdownButton>
      </InputGroup>
    }

    let recentHeaders = ''

    if (this.state.appConfig.state.recentHeaders.length > 0) {
      const items = this.state.appConfig.state.recentHeaders.map(header => {
        const label = header.name + ": " + header.value
        const labelo = header.name + ": " + this.headerValue(header, true)
        return <MenuItem key={label} onClick={this.addHeader.bind(this, header, false)}>{labelo}</MenuItem>
      })

      recentHeaders = <DropdownButton id="recent-header" title="Recent">
        {items}
      </DropdownButton>
    }

    let headers = <div></div>

    if (this.state.config.state.headers.length > 0) {
      let values = this.state.config.state.headers.map((header, idx) => {
        return <tr key={header.name + header.value}>
          <td>{header.name}</td>
          <td>{this.headerValue(header)}</td>
          <td>
            <Button bsStyle="link" onClick={this.editHeader.bind(this, header, idx)}><Glyphicon glyph="edit" bsSize="small" /></Button>
            <Button bsStyle="link" onClick={this.removeHeader.bind(this, header, idx)}><Glyphicon glyph="remove" bsSize="small" /></Button>
          </td>
        </tr>
      })

      headers = <Table>
        <thead>
          <tr>
            <th>Header Name</th>
            <th>Header Value</th>
            <th width="100px"></th>
          </tr>
        </thead>
        <tbody>
          {values}
        </tbody>
      </Table>
    }

    return <div className="graphiql-tool-cont">
      <div className="tab-top">
        <div className="tab-form">
          <Form horizontal>
            <FormGroup controlId="name-input">
              <Col componentClass={ControlLabel} sm={2}>Name</Col>
              <Col sm={10}><FormControl placeholder="Query name" bsSize="small" value={tab.state.name} onChange={this.nameChange.bind(this)} /></Col>
            </FormGroup>

            <FormGroup controlId="url-input" validationState={this.state.schemaError ? "error" : null}>
              <Col componentClass={ControlLabel} sm={2}>URL</Col>
              <Col sm={10}>
                {urlInput}
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Checkbox checked={this.state.config.state.proxy} onChange={this.proxyChange.bind(this)}>Proxy requests</Checkbox>
              </Col>
            </FormGroup>

            <FormGroup controlId="headers-input">
              <Col componentClass={ControlLabel} sm={2}>Headers</Col>
              <Col sm={10}>
                <ButtonGroup>
                  <Button bsSize="small" className="header-add" onClick={this.addHeader.bind(this)}><Glyphicon glyph="plus" /> Add</Button>
                  <DropdownButton id="std-header" title="Standard">
                    <MenuItem key="oauth-bearer" onClick={this.addHeader.bind(this, {name: "Authorization", value: "Bearer "}, true)}>OAuth 2 Bearer Token</MenuItem>
                  </DropdownButton>
                  {recentHeaders}
                </ButtonGroup>
              </Col>
            </FormGroup>
          </Form>
        </div>

        <div className="headers">
          {headers}

          <HeaderEditor headerIdx={this.state.headerIdx} header={this.state.header} onFinish={this.headerFinish.bind(this)} />
        </div>

        <div>
          <GraphiQLToolbar onToolbar={this.toolbar.bind(this)} hasClosed={this.props.hasClosed} />
        </div>
      </div>

      {this.renderGraphiql(tab)}
    </div>
  }

  collapse() {
    this.state.config.state.setState({collapsed: true})

    this.setState({config: this.state.config})
  }

  expand() {
    this.state.config.state.setState({collapsed: false})

    this.setState({config: this.state.config})
  }

  renderGraphiql(tab) {
    return <div className="graphiql-tool-cont1">
      <GraphiQL
        ref={cmp => this.graphiql = cmp}
        storage={tab.getState()}
        schema = {this.state.schema}
        fetcher={this.fetcher.bind(this)} />
    </div>
  }

  headerValue(h, partial) {
    function replace(s) {
      if (partial) {
        const first = s.substring(0, s.length - 4)
        const last = s.substring(s.length - 4)
        return _.replace(first, /./g, "\u2022") + last
      } else {
        return _.replace(s, /./g, "\u2022")
      }
    }

    if (_.toLower(h.name) == "authorization") {
      const prefix = "Bearer "

      if (h.value.startsWith(prefix)) {
        const token = h.value.substring(prefix.length)

        return prefix + replace(token)
      } else {
        return replace(h.value)
      }
    } else {
      return h.value
    }
  }

  addHeader(h, edit) {
    if (h) {
      if (edit) {
        this.setState({header: h, headerIdx: null})
      } else {
        this.headerFinish(h, null)
      }
    } else {
      this.setState({header: {name: "", value: ""}, headerIdx: null})
    }
  }

  editHeader(h, idx) {
    this.setState({header: h, headerIdx: idx})
  }

  removeHeader(h, idx) {
    this.state.config.state.headers.splice(idx, 1)
    this.state.config.state.setState({headers: this.state.config.state.headers})

    this.setState({config: this.state.config, appConfig: this.state.appConfig})
  }

  headerFinish(h, idx) {
    if (h) {
      if (idx == null) {
        this.state.config.state.setState({headers: [...this.state.config.state.headers, h]})
      } else {
        this.state.config.state.setState({headers: this.state.config.state.headers.map((header, i) => {
          if (i == idx) {
            return h
          } else {
            return header
          }
        })})
      }

      this.state.appConfig.rememberHeader(h)
    }

    this.setState({header: null, headerIdx: null})
  }

  nameChange(e) {
    this.state.config.state.setState({
      name: e.target.value
    })

    this.setState({config: this.state.config})

    if (this.props.onNameChange)
      this.props.onNameChange(e.target.value)
  }

  proxyChange(e) {
    this.state.config.state.setState({
      proxy: e.target.checked
    })

    this.setState({config: this.state.config, schemaError: false})
    this.updateSchema()
  }

  setUrl(url) {
    this.state.config.state.setState({
      url: url
    })

    const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    const regex = new RegExp(expression);

    if (url.match(regex)) {
      this.setState({config: this.state.config, schemaError: false})
      this.updateSchema()
    } else {
      this.setState({config: this.state.config, schemaError: true})
    }
  }

  urlChange(e) {
    this.setUrl(e.target.value)
  }

  updateSchema() {
    const fetch = this.fetcher({query: introspectionQuery});

    return fetch.then(result => {
      if (result && result.data) {
        this.setState({schema: buildClientSchema(result.data), schemaError: false});
      } else {
        this.setState({schemaError: true});
      }
    }).catch(error => {
      this.setState({schemaError: true});
    });
  }

  toolbar(action) {
    if (action == 'collapse') {
      this.collapse()
    } else if (action == 'expand') {
      this.expand()
    }

    if (this.props.onToolbar) {
      this.props.onToolbar.apply(this, arguments)
    }
  }

  fetcher(params) {
    if (this.state.config.state.proxy) {
      params.url = this.state.config.state.url
      params.headers = this.state.config.state.headers
    }

    const url = this.state.config.state.proxy ? "/proxy-graphql-request" : this.state.config.state.url

    const headers = new Headers();

    headers.append('Accept', 'application/json')
    headers.append('Content-Type', 'application/json')

    if (!this.state.config.state.proxy) {
      this.state.config.state.headers.forEach(h =>
        headers.append(h.name, h.value))
    }

    return fetch(url, {
      method: 'post',
      headers: headers,
      body: JSON.stringify(params),
      credentials: 'include',
    }).then(response => response.text())
    .then(responseBody => {
      try {
        const json = JSON.parse(responseBody);

        if (this.state.appConfig.rememberUrl(this.state.config.state.url))
          this.setState({appConfig: this.state.appConfig})

        return json
      } catch (error) {
        return responseBody;
      }
    });
  }
}