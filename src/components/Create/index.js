import React from 'react';
import { observer, inject } from 'mobx-react';
import styles from './style.module.css';
import Typography from 'material-ui/Typography';

import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import Card, {CardContent, CardActions} from 'material-ui/Card';
import Button from 'material-ui/Button';
import Radio, {RadioGroup} from 'material-ui/Radio';
import Checkbox from 'material-ui/Checkbox';
import { FormLabel, FormControl, FormControlLabel, FormHelperText, FormGroup } from 'material-ui/Form';
import { graphql, gql } from 'react-apollo';

@inject("store") @observer


@graphql(gql`
  mutation Mutation($gitProtocol: String!, $gitUrl: String!, $bookmarked: Boolean!) {
    createProject(project: { gitProtocol: $gitProtocol, gitUrl: $gitUrl, bookmarked: $bookmarked}) {
      id
      name
      slug
      repository
      gitUrl
      gitProtocol
      rsaPublicKey
    }
  }
`)

export default class Create extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      repoType: "",
      url: "",
      msg: "",
      title: "Create Project",
      showBadUrlMsg: false,
      urlIsValid: false,
      projectType: "docker",
      bookmarked: true,
      previousGitUrl: "",
    }
  }

  componentWillMount() {    
    if(this.props.title != null){
      this.setState({ title: this.props.title })
    }

    if(this.props.project != null){
      this.validateUrl(this.props.project.gitUrl)
    }

    if(this.props.loadLeftNavBar != false){
      this.props.store.app.setNavProjects(this.props.projects) 
    }
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.project != null){
      this.validateUrl(nextProps.project.gitUrl)
    }
  }

  handleRepoTypeChange(event){

    let urlString = this.state.url
    let msg = ""

    if(event.currentTarget.value == 'public'){
      urlString = "https://" + urlString.replace(':', '/').split("git@")[1]
      msg = "This is a valid HTTPS url."
    }

    if(event.currentTarget.value == 'private'){
      urlString = "git@" + urlString.split('https://')[1].replace('/', ':')
      msg = "This is a valid SSH url."
    }

    this.setState({ repoType: event.currentTarget.value, url: urlString, msg: msg });
  }

  validateUrl(url){

    let isHTTPS = /^https:\/\/[a-z,0-9,\.]+\/.+\.git$/.test(url)
    let isSSH = /^git@[a-z,0-9,\.]+:.+.git$/.test(url)

    if (!isHTTPS && !isSSH) {
      console.log("ERROR")
      this.setState({ 
        urlIsValid: false, 
        url: url, 
        showBadUrlMsg: true, 
        msg: '* URL must be a valid HTTPS or SSH url.', 
        repoType: ""
      })    
      return      
    }

    if(isHTTPS) {
      this.setState({ 
        previousGitUrl: this.state.url, 
        repoType: "public", 
        urlIsValid: true, 
        url: url, 
        msg: "This is a valid HTTPS url.", 
        showBadUrlMsg: false,
      })
      return
    }

    if (isSSH) {
      this.setState({ 
        previousGitUrl: this.state.url, 
        repoType: "private", 
        urlIsValid: true, 
        url: url, 
        msg: "This is a valid SSH url.", 
        showBadUrlMsg: false,
      })
      return
    }
  }

  handleUrlChange(event){
    this.validateUrl(event.target.value)
  }

  createProject(){
    // Post to graphql
    var self = this
    this.props.mutate({
      variables: { gitUrl: this.state.url, gitProtocol: this.state.repoType, bookmarked: this.state.bookmarked  }
    }).then(({data}) => {
      self.props.store.app.leftNavItems.push({
        key: data.createProject.id,
        name: data.createProject.name,
        slug: "/projects/"+data.createProject.slug,
      });
      self.props.store.app.wsSendMessage(data.createProject.name)
    }).catch(error => {
      let obj = JSON.parse(JSON.stringify(error))
      console.log(obj)
      if(Object.keys(obj).length > 0 && obj.constructor === Object){
        self.setState({ showBadUrlMsg: true, urlIsValid: false,  msg: obj.graphQLErrors[0].message })
      }
    });    
  }  

  onProjectCreate(event){
    console.log('onProjectCreate', event)
    if(this.props.onProjectCreate != null){
      this.props.onProjectCreate(this.state)
    } else {
      this.createProject();
    }
  }

  render() {

    console.log(this.state)

    let urlTextField = (
      <FormControl className={styles.formControl}>
        <InputLabel htmlFor="name-simple">Git Url</InputLabel>
        <Input
          placeholder="Enter the git url for your project."
          id="name-simple"
          value={this.state.url}
          onChange={this.handleUrlChange.bind(this)} />
        <FormHelperText>{this.state.msg}</FormHelperText>
      </FormControl>
    )

    if(this.state.showBadUrlMsg){
      urlTextField = (
        <FormControl  className={styles.formControl} error>
          <InputLabel htmlFor="name-error">Git Url</InputLabel>
          <Input id="name-error" value={this.state.url} onChange={this.handleUrlChange.bind(this)} />
          <FormHelperText>{this.state.msg}</FormHelperText>
        </FormControl>
      )
    }
    return (
      <div className={styles.root}>
        <Card className={styles.card}>
          <CardContent>
            <Typography type="subheading" className={styles.title}>
              {this.state.title}
            </Typography>
             {urlTextField}
            <FormControl
              className={styles.formControl}
              required>
              <FormLabel>
                Repository Type
              </FormLabel>
              <RadioGroup
                aria-label="repoType"
                name="repoType"
                value={this.state.value}
                onChange={this.handleRepoTypeChange.bind(this)}
              >
                <FormControlLabel disabled={!this.state.urlIsValid} value="public" control={<Radio checked={this.state.repoType === 'public'} />} label="Public" />
                <FormControlLabel disabled={!this.state.urlIsValid} value="private" control={<Radio checked={this.state.repoType === 'private'} />} label="Private" />
              </RadioGroup>


            </FormControl>

            <FormControl
              className={styles.formControl}
              required>
              <FormLabel>
                Project Type
              </FormLabel>
            <RadioGroup
                aria-label="projectType"
                name="projectType"
                value={this.state.value}
              >
                <FormControlLabel value="docker" control={<Radio checked={this.state.projectType === 'docker'} />} label="Docker" />
              </RadioGroup>
            </FormControl>


          </CardContent>
          <CardActions>
            <Button
              disabled={!this.state.urlIsValid}
              onClick={this.onProjectCreate.bind(this)}
              raised color="primary">
              {this.props.type}
            </Button>
          </CardActions>
        </Card>
      </div>
    );
  }
}
