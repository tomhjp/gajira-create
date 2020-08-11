
const nock = require('nock')
const Action = require('../action')

const auth = { email: 'test@email.com', token: 'tokentoken' }
const baseUrl = 'https://example.com'
const config = {
  ...auth,
  baseUrl,
}

const projectKey = 'TESTPROJECT'
const issuetypeName = 'TESTISSUETYPE'

const { mocks } = require('./helpers')

test(`Should create simple issue`, async () => {
  const action = new Action({
    argv: {
      project: projectKey,
      issuetype: issuetypeName,
      summary: 'This is summary {{ github.event.ref }}',
      description: 'This is description {{ github.event.ref }}',
      team: "product",
      fixversion: "TBD",
    },
    config,
  })

  const createMetaRequest = nock(baseUrl)
    .get('/rest/api/2/issue/createmeta')
    .query({
      expand: 'projects.issuetypes.fields',
      projectKeys: 'TESTPROJECT',
      issuetypeNames: 'TESTISSUETYPE',
    })
    .reply(200, mocks.jira.responses.createMeta)

  let createIssueRequestBody = {}
  const createIssueRequest = nock(baseUrl)
    .post('/rest/api/2/issue')
    .reply(200, (url, body) => {
      createIssueRequestBody = body

      return {
        key: 'TESTPROJECT-2',
      }
    })

  await createMetaRequest
  await createIssueRequest

  const result = await action.execute()

  expect(createIssueRequestBody).toEqual({
    fields: {
      project: {
        key: projectKey,
      },
      issuetype: {
        name: issuetypeName,
      },
      summary: 'This is summary {{ github.event.ref }}',
      description: 'This is description {{ github.event.ref }}',
      customfield_10091: ["product"],
      fixVersions: [{name: "TBD"}]
    },
  })

  expect(result).toEqual({
    issue: 'TESTPROJECT-2',
  })
})
