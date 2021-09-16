import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { getProjects, resetProject } from "../../actions/projectActions";
import { clearMessages } from "../../actions/messageActions";

import { Link, withRouter } from "react-router-dom";

import Breadcrumbs from "../Breadcrumbs";
import BlocklyWindow from "../Blockly/BlocklyWindow";
import Snackbar from "../Snackbar";
import WorkspaceFunc from "../Workspace/WorkspaceFunc";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "../Dialog";
import Button from "@material-ui/core/Button";

const styles = (theme) => ({
  link: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
      textDecoration: "underline",
    },
  },
});

class ProjectHome extends Component {
  state = {
    snackbar: false,
    type: "",
    key: "",
    message: "",
    dialog: false,
  };

  componentDidMount() {
    var type = this.props.location.pathname.replace("/", "");
    this.props.getProjects(type);
    if (this.props.message) {
      if (this.props.message.id === "PROJECT_DELETE_SUCCESS") {
        this.setState({
          snackbar: true,
          key: Date.now(),
          message: `Dein Projekt wurde erfolgreich gelöscht.`,
          type: "success",
        });
      } else if (this.props.message.id === "GALLERY_DELETE_SUCCESS") {
        this.setState({
          snackbar: true,
          key: Date.now(),
          message: `Dein Galerie-Projekt wurde erfolgreich gelöscht.`,
          type: "success",
        });
      } else if (this.props.message.id === "GET_PROJECT_FAIL") {
        this.setState({
          snackbar: true,
          key: Date.now(),
          message: `Dein angefragtes ${
            type === "gallery" ? "Galerie-" : ""
          }Projekt konnte nicht gefunden werden.`,
          type: "error",
        });
      }
    }
  }

  componentDidUpdate(props) {
    if (props.location.pathname !== this.props.location.pathname) {
      this.setState({ snackbar: false });
      this.props.getProjects(this.props.location.pathname.replace("/", ""));
    }
    if (props.message !== this.props.message) {
      if (this.props.message.id === "PROJECT_DELETE_SUCCESS") {
        this.setState({
          snackbar: true,
          key: Date.now(),
          message: `Dein Projekt wurde erfolgreich gelöscht.`,
          type: "success",
        });
      } else if (this.props.message.id === "GALLERY_DELETE_SUCCESS") {
        this.setState({
          snackbar: true,
          key: Date.now(),
          message: `Dein Galerie-Projekt wurde erfolgreich gelöscht.`,
          type: "success",
        });
      }
    }
  }

  componentWillUnmount() {
    this.props.resetProject();
    this.props.clearMessages();
  }

  render() {
    var data =
      this.props.location.pathname === "/project" ? "Projekte" : "Galerie";
    return (
      <div>
        <Breadcrumbs
          content={[{ link: this.props.location.pathname, title: data }]}
        />

        <h1>{data}</h1>
        {this.props.progress ? (
          <Backdrop open invisible>
            <CircularProgress color="primary" />
          </Backdrop>
        ) : (
          <div>
            {this.props.projects.length > 0 ? (
              <Grid container spacing={2}>
                {this.props.projects.map((project, i) => {
                  return (
                    <Grid item xs={12} sm={6} md={4} xl={3} key={i}>
                      <Paper
                        style={{
                          padding: "1rem",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => {
                            console.log(this.props.workspaceCode.arduino);
                            const showDialog =
                              this.props.workspaceCode.arduino !==
                              "void setup() { } void loop() { } ";
                            if (showDialog)
                              this.setState({
                                dialog: true,
                              });
                            else {
                              this.props.history.push(
                                `/${
                                  data === "Projekte" ? "project" : "gallery"
                                }/${project._id}`
                              );
                            }
                          }}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <h3 style={{ marginTop: 0 }}>{project.title}</h3>
                          <Divider
                            style={{ marginTop: "1rem", marginBottom: "10px" }}
                          />
                          <BlocklyWindow
                            svg
                            blockDisabled
                            readOnly
                            initialXml={project.xml}
                          />
                          <Typography
                            variant="body2"
                            style={{
                              fontStyle: "italic",
                              margin: 0,
                              marginTop: "-10px",
                            }}
                          >
                            {project.description}
                          </Typography>
                        </div>
                        {this.props.user &&
                        this.props.user.email === project.creator ? (
                          <div>
                            <Divider
                              style={{
                                marginTop: "10px",
                                marginBottom: "10px",
                              }}
                            />
                            <div style={{ float: "right" }}>
                              <WorkspaceFunc
                                multiple
                                project={project}
                                projectType={this.props.location.pathname.replace(
                                  "/",
                                  ""
                                )}
                              />
                            </div>
                          </div>
                        ) : null}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <div>
                <Typography style={{ marginBottom: "10px" }}>
                  Es sind aktuell keine Projekte vorhanden.
                </Typography>
                {this.props.location.pathname.replace("/", "") === "project" ? (
                  <Typography>
                    Erstelle jetzt dein{" "}
                    <Link to={"/"} className={this.props.classes.link}>
                      eigenes Projekt
                    </Link>{" "}
                    oder lasse dich von Projektbeispielen in der{" "}
                    <Link to={"/gallery"} className={this.props.classes.link}>
                      Galerie
                    </Link>{" "}
                    inspirieren.
                  </Typography>
                ) : null}
              </div>
            )}
          </div>
        )}
        <Snackbar
          open={this.state.snackbar}
          message={this.state.message}
          type={this.state.type}
          key={this.state.key}
        />
        <Dialog
          open={this.state.dialog}
          title="Achtung"
          actions={
            <React.Fragment>
              <Button
                onClick={() => {
                  this.setState({ dialog: false });
                }}
                color="secondary"
              >
                Schließen
              </Button>
              <Button onClick={() => {}} color="primary">
                Speichern
              </Button>
            </React.Fragment>
          }
        >
          Hello World
        </Dialog>
      </div>
    );
  }
}

ProjectHome.propTypes = {
  getProjects: PropTypes.func.isRequired,
  resetProject: PropTypes.func.isRequired,
  clearMessages: PropTypes.func.isRequired,
  projects: PropTypes.array.isRequired,
  progress: PropTypes.bool.isRequired,
  user: PropTypes.object,
  message: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  projects: state.project.projects,
  progress: state.project.progress,
  user: state.auth.user,
  message: state.message,
  workspaceCode: state.workspace.code,
});

export default connect(mapStateToProps, {
  getProjects,
  resetProject,
  clearMessages,
})(withStyles(styles, { withTheme: true })(withRouter(ProjectHome)));
