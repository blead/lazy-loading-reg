const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const { DATA_PATH } = require('./defaults');
const { regRequest, getSession, cleanString, createKey, createResponse } = require('./utils');
const { getCourseList } = require('./courseList');
const { caching } = require('./config');

if (caching) {
  var { cache } = require('./cache');
}

function getCourseInformation(semester='2', year='2561', courseNumber, studyProgram='S') {
  return getSession()
    .then(() => getCourseList(semester, year, courseNumber, studyProgram))
    .then(() => regRequest({
      uri: DATA_PATH,
      qs: {
        courseNo: courseNumber,
        studyProgram,
      },
    }))
    .then(buffer => iconv.decode(buffer, 'tis620'));
}

function parseCourseInformation(document) {
  const $ = cheerio.load(document);
  const table2 = $('#Table2');
  const table3 = $('#Table3');
  const table4 = $('#Table4');
  const creditTable = $('table:nth-of-type(3)');

  if (table2.length === 0 || table3.length === 0 || table4.length === 0) {
    throw new Error('Course information not found');
  }

  const table2Fonts = table2.find('font');
  const table4Fonts = table4.find('font');
  const creditTableFonts = creditTable.find('font');

  return {
    yearSemester: cleanString(table2Fonts.eq(0).text()),
    studyProgram: cleanString(table2Fonts.eq(1).text()),
    number: cleanString(table2Fonts.eq(2).text()),
    name: {
      abbreviation: cleanString(table2Fonts.eq(3).text()),
      th: cleanString(table2Fonts.eq(4).text()),
      en: cleanString(table2Fonts.eq(5).text())
    },
    faculty: cleanString(table2Fonts.eq(6).text()),
    midtermExamDate: cleanString(table4Fonts.eq(1).text()),
    finalExamDate: cleanString(table4Fonts.eq(3).text()),
    credits: cleanString(creditTableFonts.eq(0).text()),
    condition: cleanString(creditTableFonts.eq(5).text()),
    sections: table3.find('tr')
      .toArray()
      .slice(2)
      .map(element => {
        const tds = $(element).find('td');
        return {
          status: cleanString(tds.eq(0).text()) === '' ? 'open' : 'closed',
          number: cleanString(tds.eq(1).text()),
          type: cleanString(tds.eq(2).text()),
          building: cleanString(tds.eq(5).text()),
          room: cleanString(tds.eq(6).text()),
          instructors: cleanString(tds.eq(7).text()).split(','),
          remarks: cleanString(tds.eq(8).text()),
          seats: cleanString(tds.eq(9).text()),
          date: cleanString(tds.eq(3).text()),
          time: cleanString(tds.eq(4).text()),
        };
      }),
  };
}

async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  let semester, year, courseNumber, studyProgram;
  if (event.pathParameters) {
    courseNumber = event.pathParameters.courseNumber;
  }
  if (event.queryStringParameters) {
    semester = event.queryStringParameters.semester;
    year = event.queryStringParameters.year;
    studyProgram = event.queryStringParameters.studyProgram;
  }
  const key = createKey('info', semester, year, courseNumber, studyProgram);
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
    const result = await getCourseInformation(semester, year, courseNumber, studyProgram)
      .then(parseCourseInformation)
    const responseBody = JSON.stringify(result);
      if (caching) {
        cache.set(key, responseBody);
      }
      return createResponse(responseBody);
  } catch (error) {
    if (error.message === 'Course information not found') {
      return { statusCode: '404' };
    } else {
      throw error;
    }
  }
}

module.exports = {
  handler,
};
