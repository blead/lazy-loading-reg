const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const { PARAM_PATH } = require('./defaults');
const { regRequest, getSession, cleanString, createKey, createResponse } = require('./utils');
const { caching } = require('./config');

if (caching) {
  var { cache } = require('./cache');
}

/*
semester: 1|2|3
studyProgram: S|T|I
*/
function getCourseList(semester='2', year='2561', courseNumber='%%', studyProgram='S') {
  return getSession()
    .then(() => regRequest({
      uri: PARAM_PATH,
      qs: {
        semester,
        acadyear: year,
        courseno: courseNumber,
        studyProgram,
      },
    }))
    .then(buffer => iconv.decode(buffer, 'tis620'));
}

function parseCourseList(document) {
  const $ = cheerio.load(document);
  return $('#Table4 tr')
    .toArray()
    .map(element => {
      const fonts = $(element).find('font');
      return {
        number: cleanString(fonts.first().text()),
        name: cleanString(fonts.last().text()),
      };
    });
}

async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  let semester, year, courseNumber, studyProgram;
  if (event.queryStringParameters) {
    semester = event.queryStringParameters.semester;
    year = event.queryStringParameters.year;
    courseNumber = event.queryStringParameters.courseNumber;
    studyProgram = event.queryStringParameters.studyProgram;
  }
  const key = createKey('list', semester, year, courseNumber, studyProgram);
  if (caching) {
    try {
      const responseBody = await cache.get(key);
      if (responseBody) {
        return createResponse(responseBody);
      }
    } catch (error) {
      console.log(error);
    }
  }
  try {
    const result = await getCourseList(semester, year, courseNumber, studyProgram)
      .then(parseCourseList)
    const responseBody = JSON.stringify(result);
    if (caching) {
      cache.set(key, responseBody);
    }
    return createResponse(responseBody);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getCourseList,
  handler,
};
