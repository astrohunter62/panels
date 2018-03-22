import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Menu, { MenuItem } from 'material-ui/Menu';
import Paper from 'material-ui/Paper';
import { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';
import Button from 'material-ui/Button';
import Logo from './logo_white.png';
import styles from './style.module.css';

@inject("store") @observer
export default class TopNav extends React.Component {
  state = {
    userAnchorEl: undefined,
    originalSuggestions: [],
    suggestions: [],
    value: '',
    hovering: false,
  };

  componentDidMount(){
    const originalSuggestions = this.props.projects.map(function(project){
        return { id: project.id, label: project.name, project: project }
    })
    this.setState({ originalSuggestions: originalSuggestions })
  }

  handleUserClick = event => {
    this.setState({ userAnchorEl: event.currentTarget });
  };
  handleUserClose = () => {
    this.setState({ userAnchorEl: null });
  };

  logout = () => {
    this.handleUserClose();
    window.location.href = '/login';
  }

  escapeRegExp(str) {
    return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  }

  getSuggestions(value) {
    const cleanedValue = this.escapeRegExp(value.trim().toLowerCase());
    let re = new RegExp(cleanedValue, "i");

    return cleanedValue === '' ? [] : this.state.originalSuggestions.filter((project) => {
      return project.label.toLowerCase().match(re)
    });
  }

  renderBookmarks(e){
    let query = e.target.value
    if (query === "") {
      query = "/"
    }
    const suggestions = this.getSuggestions(query)
    this.setState({ suggestions: suggestions, showSuggestions: true })
  }

  hideSuggestions(force=false){
    if(force){
      this.setState({ showSuggestions: false, suggestions: [], hovering: false })
      return
    }
    if(!this.state.hovering){
      this.setState({ showSuggestions: false, suggestions: [], hovering: false })
    }
  }

  onSuggestionItemClick(suggestion){
    this.props.history.push('/projects/' + suggestion.project.slug)      
    this.hideSuggestions(true)
  }

  onChange(e){
    const suggestions = this.getSuggestions(e.target.value)
    this.setState({ suggestions: suggestions, showSuggestions: true })
  }

  render() {
    var self = this
    const { store } = this.props
    const { app } = this.props.store;
    
    return (
      <div>
        <AppBar position="static" className={styles.appBar}>
            <Toolbar>
              <Grid container spacing={24}>
                <Grid item xs={2}>
                  <NavLink to="/" exact style={{ color: "white" }}>
                    <img src={Logo} alt="Codeamp" className={styles.logo}/>
                  </NavLink>
                </Grid>
                <Grid item xs={6}>
                  <div style={{position: "relative"}}>
                  <TextField
                    fullWidth={true}
                    className={styles.searchInput}
                    autoFocus={false}
                    value={this.state.projectQuery}
                    placeholder="Search..."
                    InputProps={{
                      disableUnderline: true,
                      classes: {
                        root: styles.textFieldRoot,
                        input: styles.textFieldInput,
                      },
                    }}
                    InputLabelProps={{
                      shrink: true,
                      className: styles.textFieldFormLabel,
                    }}
                    onClick={(e)=>this.renderBookmarks(e)}
                    onChange={(e)=>this.onChange(e)}
                    onBlur={(e)=>this.hideSuggestions()}
                  />
                    <div className={this.state.showSuggestions ? styles.suggestions : styles.showNone}>
                      {this.state.suggestions.map(function(suggestion){
                        return (
                          <Paper
                            key={suggestion.id}
                            className={styles.suggestion}
                            square={true}>
                            <ListItem
                              onMouseEnter={() => self.setState({ hovering: true })}
                              onMouseLeave={() => self.setState({ hovering: false })}
                              onClick={()=>self.onSuggestionItemClick(suggestion)}>
                              <ListItemText primary={suggestion.label} />
                            </ListItem>
                          </Paper>
                        )
                      })}
                      </div>
                  </div>
                </Grid>

                <Grid item xs={4} style={{textAlign: "right"}}>
                  <Button
                    style={{margin: "0 8px"}}
                    variant="raised"
                    aria-owns={this.state.anchorEl ? 'user-menu' : null}
                    aria-haspopup="true"
                    onClick={this.handleUserClick}>
                    {store.app.user.profile.email}
                  </Button>
                  <Menu
                    id="user-menu"
                    anchorEl={this.state.userAnchorEl}
                    open={Boolean(this.state.userAnchorEl)}
                    onClose={this.handleUserClose}>
                    <MenuItem onClick={this.logout}>Logout</MenuItem>
                  </Menu>
                </Grid>
              </Grid>
            </Toolbar> 

          <Switch>
            <Route path='/projects/:slug' render={(props) => (
              <div style={{ border: "3px solid " + app.currentEnvironment.color }}></div>
            )} />
          </Switch>
        </AppBar>

        {store.app.connectionHeader.msg !== "" &&
            <AppBar position="absolute" color="default">
              <Toolbar>
                  <Grid container spacin={24}>
                      <Grid item xs={1}>
                      <Typography variant="body1">
                          <a href={window.location.href}>
                          try refreshing
                          </a>
                      </Typography>
                      </Grid>
                      <Grid item xs={11} className={styles.center}>
                          <Typography>
                              { store.app.connectionHeader.msg }
                          </Typography>
                      </Grid>
                  </Grid>
              </Toolbar>
              <LinearProgress color="accent" />
            </AppBar>
        }
      </div>
    );
  }
}
