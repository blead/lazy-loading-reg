const request = require('request-promise-native');
const { BASE_URL, SESSION_PATH } = require('./defaults');

const regRequest = request.defaults({
  baseUrl: BASE_URL,
  encoding: null,
  jar: true,
  agentOptions: {
    rejectUnauthorized: false,
  },
});

function getSession() {
  return regRequest({
    uri: SESSION_PATH
  });
}

function cleanString(string) {
  if (typeof(string) !== 'string') {
    return undefined;
  }

  return string
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
}

function createKey(label, semester='2', year='2561', courseNumber='%%', studyProgram='S') {
  return `${label},${semester},${year},${courseNumber},${studyProgram}`;
}

function createResponse(body) {
  return {
    statusCode: '200',
    body,
    headers: { 'Content-Type': 'application/json' },
  };
}

module.exports = {
  regRequest,
  getSession,
  cleanString,
  createKey,
  createResponse,
};
