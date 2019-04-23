const { handler: courseList } = require('./courseList');
const { handler: courseInformation } = require('./courseInformation');

function logResponse(response) {
  console.log(response.body);
}

courseList({ queryStringParameters: null, pathParameters: null }, null)
  .then(logResponse)
courseInformation({ queryStringParameters: null, pathParameters: { courseNumber: '2101653' } }, null)
  .then(logResponse);
