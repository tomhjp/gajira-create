const _ = require('lodash')
const Jira = require('./common/net/Jira')

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute () {
    console.log("Raw description")
    console.log(this.argv.description)
    this.preprocessArgs()

    const { argv } = this
    const projectKey = argv.project
    const issuetypeName = argv.issuetype

    // map custom fields
    const { projects } = await this.Jira.getCreateMeta({
      expand: 'projects.issuetypes.fields',
      projectKeys: projectKey,
      issuetypeNames: issuetypeName,
    })

    if (projects.length === 0) {
      console.error(`project '${projectKey}' not found`)

      return
    }

    const [project] = projects

    if (project.issuetypes.length === 0) {
      console.error(`issuetype '${issuetypeName}' not found`)

      return
    }

    let providedFields = [{
      key: 'project',
      value: {
        key: projectKey,
      },
    }, {
      key: 'issuetype',
      value: {
        name: issuetypeName,
      },
    }, {
      key: 'summary',
      value: argv.summary,
    }, {
      key: 'fixVersions',
      value: [{"name": "TBD"}],
    }, {
      // Team
      key: 'customfield_10091',
      value: ["product"],
    }]

    if (argv.description) {
      providedFields.push({
        key: 'description',
        value: argv.description,
      })
    }

    const payload = providedFields.reduce((acc, field) => {
      acc.fields[field.key] = field.value

      return acc
    }, {
      fields: {},
    })

    console.log(payload)
    // const issue = await this.Jira.createIssue(payload)

    // return { issue: issue.key }
  }

  transformFields (fields) {
    return Object.keys(fields).map(fieldKey => ({
      key: fieldKey,
      value: fields[fieldKey],
    }))
  }

  preprocessArgs () {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g
    const summaryTmpl = _.template(this.argv.summary)
    const descriptionTmpl = _.template(this.argv.description)

    this.argv.summary = summaryTmpl({ event: this.githubEvent })
    this.argv.description = descriptionTmpl({ event: this.githubEvent })
  }
}
