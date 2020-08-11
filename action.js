const Jira = require('./common/net/Jira')

module.exports = class {
  constructor ({ argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
  }

  async execute () {
    let payload = {
      fields: {
        project: {key: this.argv.project},
        issuetype: {name: this.argv.issuetype},
        summary: this.argv.summary,
        description: this.argv.description,
        fixVersions: [{name: this.argv.fixversion}],
        customfield_10091: [this.argv.team],
        customfield_10089: this.argv.issuelink,
        labels: [this.argv.issuelink.indexOf("issues") > -1 ? "issue" : "pull-request"],
      }
    }

    const issue = await this.Jira.createIssue(payload)

    return { issue: issue.key }
  }
}
