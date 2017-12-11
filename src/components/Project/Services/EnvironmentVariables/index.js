import React from 'react';

import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Table, { TableCell, TableHead, TableBody, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Input from 'material-ui/Input';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Menu, { MenuItem } from 'material-ui/Menu';

import InputField from 'components/Form/input-field';
import TextareaField from 'components/Form/textarea-field';

import AddIcon from 'material-ui-icons/Add';

import styles from './style.module.css';
import { observer } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const inlineStyles = {
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  }
}

@graphql(gql`
  mutation CreateEnvironmentVariable ($key: String!, $value: String!, $projectId: String!, $type: String!, $scope: String!, $environmentId: String!) {
      createEnvironmentVariable(environmentVariable:{
      projectId: $projectId,
      key: $key,
      value: $value,
      type: $type,
      scope: $scope,
      environmentId: $environmentId,
      }) {
          id
          key
          value
          user {
            id
            email
          }
          project {
            id
            name
          }
          version
          created
      }
  }
`, { name: "createEnvironmentVariable" })

@graphql(gql`
mutation UpdateEnvironmentVariable ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String!) {
    updateEnvironmentVariable(environmentVariable:{
    id: $id,
    key: $key,
    value: $value,
	type: $type,
    scope: $scope,
    environmentId: $environmentId,
    }) {
        id
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        version
        created
    }
}
`, { name: "updateEnvironmentVariable" })

@graphql(gql`
mutation DeleteEnvironmentVariable ($id: String!, $key: String!, $value: String!, $type: String!, $scope: String!, $environmentId: String!) {
    deleteEnvironmentVariable(environmentVariable:{
    id: $id,
    key: $key,
    value: $value,
	  type: $type,
    scope: $scope,
    environmentId: $environmentId,
    }) {
        id
        key
        value
        user {
          id
          email
        }
        project {
          id
          name
        }
        version
        created
    }
}
`, { name: "deleteEnvironmentVariable" })

@observer
export default class EnvironmentVariables extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      addEnvVarMenuOpen: false,
      saving: false,
      drawerOpen: false,
    }
  }

  componentWillMount(){
    const fields = [
      'id',
      'projectId',
      'key',
      'value',
      'created',
      'version',
      'type',
      'scope',
      'environmentId',
      'index',
    ];
    const rules = {
    'key': 'string|required',
    'value': 'string|required',
    };
    const labels = {
      'key': 'Key',
      'value': 'Value',
      'version': 'Version',
    };
    const initials = {}
    const types = {};
    const keys = {};
    const disabled = {
      'key': false
    }
    const extra = {
      'type': [{key: 'Build', value: 'Build'}, {key: 'Normal', value: 'Normal' },{key: 'File', value: 'File'}]
    };
    const hooks = {};
    const plugins = { dvr: validatorjs };

    this.form = new MobxReactForm({ fields, rules, disabled, labels, initials, extra, hooks, types, keys }, { plugins });
  }

  handleAddClick(event){
    this.setState({ addEnvVarMenuOpen: true, anchorEl: event.currentTarget, currentService: { id: -1 } });
  }

  onSubmit(e) {
    this.setState({ saving: true})
    this.form.$('key').set('disabled', false)
    this.form.onSubmit(e, { onSuccess: this.onSuccess.bind(this), onError: this.onError.bind(this) })
  }

  onClick(envVarIdx){
    const envVar = this.props.project.environmentVariables[envVarIdx]
    if(envVar !== undefined){
        this.form.$('key').set(envVar.key)
        this.form.$('key').set('disabled', true)
        this.form.$('value').set(envVar.value)
        this.form.$('type').set(envVar.type)
        this.form.$('id').set(envVar.id)
        this.form.$('index').set(envVarIdx)
        this.setState({ drawerOpen: true })
    }
  }

  onError(form){
    this.setState({ saving: false })
  }

  replaceEnvVarValue(){
    this.form.$('value').set(this.props.project.environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value);
  }

  onSuccess(form){

    form.$('projectId').set(this.props.project.id)
    form.$('environmentId').set(this.props.store.app.currentEnvironment.id)
    form.$('scope').set('project')

    this.form.$('key').set('disabled', false)
    if(this.form.values()['id'] === ''){
      this.props.createEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        this.props.data.refetch()
        this.closeDrawer()
      });
    } else {
      this.props.updateEnvironmentVariable({
        variables: form.values(),
      }).then(({data}) => {
        this.setState({ saving: false })
      });
    }
  }
  
  handleRequestClose = value => {
    this.form.clear()
    this.form.$('type').set(value);
    this.form.$('key').set('disabled', false)
    this.setState({ addEnvVarMenuOpen: false, drawerOpen: true });
  };

  openDrawer(){
    this.form.showErrors(false)
    this.setState({ drawerOpen: true })
  }

  closeDrawer(){
    this.form.reset()
    this.setState({ drawerOpen: false, addEnvVarMenuOpen: false })
  }

  handleDeleteEnvVar(){
    this.props.deleteEnvironmentVariable({
      variables: this.form.values(),
    }).then(({data}) => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    });
    this.setState({ dialogOpen: false })
  }

  render() {

    const { environmentVariables } = this.props.project;
    
    let deleteButton = "";

    if(environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['index']].id !== -1){
      deleteButton = (
        <Button
          disabled={this.state.saving || environmentVariables[this.form.values()['index']].type === "Extension Generated"}
          color="accent"
          onClick={()=>this.setState({ dialogOpen: true })}>
          Delete
        </Button>
      );
    }

    var self = this;

    return (
      <div>
        <Paper className={styles.tablePaper}>
          <Toolbar>
            <div>
              <Typography type="title">
                Environment Variables
              </Typography>
            </div>
          </Toolbar>
          <Table bodyStyle={{ overflow: 'visible' }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  Key
                </TableCell>
                <TableCell>
                  Type
                </TableCell>
                <TableCell>
                  Creator
                </TableCell>
                <TableCell>
                </TableCell>
                <TableCell>
                  Version
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {environmentVariables.map(function(envVar, idx){
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    onClick={()=> self.onClick(idx)}
                    key={envVar.id}>
                    <TableCell>
                      {envVar.key}
                    </TableCell>

                    <TableCell>
                      {envVar.type}
                    </TableCell>

                    <TableCell>
                      {envVar.user.email}
                    </TableCell>

                    <TableCell>
                      {new Date(envVar.created).toString()}
                    </TableCell>

                    <TableCell>
                      {envVar.version}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        <Button fab aria-label="Add" type="submit" raised color="primary"
            style={inlineStyles.addButton}
            onClick={this.handleAddClick.bind(this)}>
            <AddIcon />
        </Button>

        <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            open={this.state.addEnvVarMenuOpen}
            onRequestClose={this.handleRequestClose}
        >
          <MenuItem onClick={() => this.handleRequestClose("normal")}>Normal</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("build-arg")}>Build Arg</MenuItem>
          <MenuItem onClick={() => this.handleRequestClose("file")}>File</MenuItem>
        </Menu>

        <Drawer
            type="persistent"
            anchor="right"
            classes={{
            paper: styles.list,
            }}
            open={this.state.drawerOpen}
        >
            <div tabIndex={0} className={styles.createServiceBar}>
              <AppBar position="static" color="default">
                  <Toolbar>
                  <Typography type="title" color="inherit">
                      Environment Variable
                  </Typography>
                  </Toolbar>
              </AppBar>
              <form>
                <div className={styles.drawerBody}>
                  <Grid container spacing={24} className={styles.grid}>
                    {this.form.$('type').value === 'normal' &&
                      <Grid item xs={12}>
                        <Grid item xs={6}>
                          <InputField field={this.form.$('key')} fullWidth={true} />
                        </Grid>
                        <Grid item xs={6}>
                          <InputField field={this.form.$('value')} fullWidth={true} />
                        </Grid>
                        {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['selectedVersionIndex']].versions &&
                          <Grid item xs={6}>
                            <Input value={environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value} fullWidth={true} disabled />
                          </Grid>
                        }
                      </Grid>
                    }

                    {this.form.$('type').value === 'file' &&
                      <Grid item xs={12}>
                        <Grid item xs={5}>
                          <InputField field={this.form.$('key')} fullWidth={true} />
                        </Grid>
                        <br/>
                        <Grid item xs={5}>
                          <TextareaField field={this.form.$('value')} />
                        </Grid>
                        {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['selectedVersionIndex']].versions &&
                          <Grid item xs={6}>
                            <textarea style={{ width: 300, height: 200, scrollable: 'true' }} readOnly>
                              {environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value}
                            </textarea>
                          </Grid>
                        }
                      </Grid>
                    }

                    {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['index']].versions && environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']] && environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].id !== -1 &&
                      <Grid item xs={12}>
                        <Button color="default"
                          disabled={environmentVariables[this.form.values()['index']].versions[this.form.values()['selectedVersionIndex']].value === this.form.$('value').value}
                          raised onClick={this.replaceEnvVarValue.bind(this)}>
                          Use It
                        </Button>
                      </Grid>
                    }
                    <Grid item xs={12}>
                      <Button color="primary"
                          className={styles.buttonSpacing}
                          disabled={this.state.saving || environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && this.form.$('value').value === environmentVariables[this.form.values()['index']].value}
                          type="submit"
                          raised
                          onClick={e => this.onSubmit(e)}>
                          Save
                      </Button>
                      { deleteButton }
                      <Button
                        color="primary"
                        onClick={this.closeDrawer.bind(this)}>
                        Cancel
                      </Button>
                    </Grid>
                    {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['index']].id !== -1 &&
                      <Grid item xs={12}>
                          <Paper className={styles.tablePaper}>
                          <Toolbar>
                            <div>
                              <Typography type="title">
                                Version History
                              </Typography>
                            </div>
                          </Toolbar>
                          <Table bodyStyle={{ overflow: 'visible' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  Version
                                </TableCell>
                                <TableCell>
                                  Creator
                                </TableCell>
                                <TableCell>
                                  Created At
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                            {environmentVariables[this.form.values()['index']] && environmentVariables[this.form.values()['index']].versions.map(function(envVar, idx){
                              return (
                                <TableRow
                                  hover
                                  tabIndex={-1}
                                  onClick={() => self.onClick(idx)}
                                key={envVar.id}>
                                <TableCell>
                                  {envVar.version}
                                </TableCell>
                                <TableCell>
                                  {envVar.user.email}
                                </TableCell>
                                <TableCell>
                                  {new Date(envVar.created).toString()}
                                </TableCell>
                              </TableRow>
                              )
                            })}
                            </TableBody>
                          </Table>
                        </Paper>
                      </Grid>
                    }
                  </Grid>
                </div>
              </form>
            </div>
        </Drawer>
        {environmentVariables.length > 0 && environmentVariables[this.form.values()['index']] &&
            <Dialog open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })}>
              <DialogTitle>{"Are you sure you want to delete " + environmentVariables[this.form.values()['index']].key + "?"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {"This will delete the environment variable and all its versions associated with" + this.props.project.name + "."}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={()=> this.setState({ dialogOpen: false })} color="primary">
                  Cancel
                </Button>
                <Button onClick={this.handleDeleteEnvVar.bind(this)} color="accent">
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
        }
      </div>
    )
  }

}
