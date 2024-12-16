function getWeeks(Str) {
  function range(con, tag) {
      let retWeek = [];
      con.slice(0, -1).split(',').forEach(w => {
          let tt = w.split('-');
          let start = parseInt(tt[0]);
          let end = parseInt(tt[tt.length - 1]);
          if (tag === 1 || tag === 2) {
              retWeek.push(...Array(end + 1 - start).fill(start).map((x, y) => x + y).filter(f => f % tag === 0));
          } else {
              retWeek.push(...Array(end + 1 - start).fill(start).map((x, y) => x + y).filter(v => v % 2!== 0));
          }
      });
      return retWeek;
  }

  Str = Str.replace(/[(){}|第\[\]]/g, "").replace(/到/g, "-");
  let reWeek = [];
  let weekArr = [];
  while (Str.search(/周|\s/)!== -1) {
      let index = Str.search(/周|\s/);
      if (Str[index + 1] === '单' || Str[index + 1] === '双') {
          weekArr.push(Str.slice(0, index + 2).replace(/周|\s/g, ""));
          index += 2;
      } else {
          weekArr.push(Str.slice(0, index + 1).replace(/周|\s/g, ""));
          index += 1;
      }

      Str = Str.slice(index);
      index = Str.search(/\d/);
      if (index!== -1) Str = Str.slice(index);
      else Str = "";
  }
  if (Str.length!== 0) weekArr.push(Str);
  weekArr.forEach(v => {
      if (v.slice(-1) === "双") reWeek.push(...range(v, 2));
      else if (v.slice(-1) === "单") reWeek.push(...range(v, 3));
      else reWeek.push(...range(v + "全", 1));
  });
  return reWeek;
}

function getSection(Str) {
  let sectionArr = [];
  let strArr = Str.replace("节", "").trim().split("-");
  if (strArr.length <= 2) {
      for (let i = Number(strArr[0]); i <= Number(strArr[strArr.length - 1]); i++) {
          sectionArr.push(Number(i));
      }
  } else {
      strArr.forEach(v => {
          sectionArr.push(Number(v));
      });
  }
  return sectionArr;
}

function resolveCourseConflicts(result) {
  let splitIdentifier = "&";
  let allResultSet = new Set();
  result.forEach(singleCourse => {
      singleCourse.weeks.forEach(week => {
          singleCourse.sections.forEach(value => {
              let course = { sections: [], weeks: [] };
              course.name = singleCourse.name;
              course.teacher = singleCourse.teacher === undefined? "" : singleCourse.teacher;
              course.position = singleCourse.position === undefined? "" : singleCourse.position;
              course.day = singleCourse.day;
              course.weeks.push(week);
              course.sections.push(value);
              allResultSet.add(JSON.stringify(course));
          });
      });
  });
  let allResult = JSON.parse("[" + Array.from(allResultSet).toString() + "]").sort(function (a, b) {
      return (a.day - b.day) || (a.sections[0] - b.sections[0]);
  });

  let contractResult = [];
  while (allResult.length!== 0) {
      let firstCourse = allResult.shift();
      if (firstCourse == undefined) continue;
      let dayTag = firstCourse.day;
      for (let i = 0; allResult[i]!== undefined && dayTag === allResult[i].day; i++) {
          if (firstCourse.weeks[0] === allResult[i].weeks[0]) {
              if (firstCourse.sections[0] === allResult[i].sections[0]) {
                  let index = firstCourse.name.split(splitIdentifier).indexOf(allResult[i].name);
                  if (index === -1) {
                      firstCourse.name += splitIdentifier + allResult[i].name;
                      firstCourse.teacher += splitIdentifier + allResult[i].teacher;
                      firstCourse.position += splitIdentifier + allResult[i].position;
                      allResult.splice(i, 1);
                      i--;
                  } else {
                      let teacherArr = firstCourse.teacher.split(splitIdentifier);
                      let positionArr = firstCourse.position.split(splitIdentifier);
                      teacherArr[index] = teacherArr[index] === allResult[i].teacher? teacherArr[index] : teacherArr[index] + "," + allResult[i].teacher;
                      positionArr[index] = positionArr[index] === allResult[i].position? positionArr[index] : positionArr[index] + "," + allResult[i].position;
                      firstCourse.teacher = teacherArr.join(splitIdentifier);
                      firstCourse.position = positionArr.join(splitIdentifier);
                      allResult.splice(i, 1);
                      i--;
                  }
              }
          }
      }
      contractResult.push(firstCourse);
  }

  let finalResult = [];
  while (contractResult.length!== 0) {
      let firstCourse = contractResult.shift();
      if (firstCourse == undefined) continue;
      let dayTag = firstCourse.day;
      for (let i = 0; contractResult[i]!== undefined && dayTag === contractResult[i].day; i++) {
          if (firstCourse.weeks[0] === contractResult[i].weeks[0] && firstCourse.name === contractResult[i].name && firstCourse.position === contractResult[i].position && firstCourse.teacher === contractResult[i].teacher) {
              if (firstCourse.sections[firstCourse.sections.length - 1] + 1 === contractResult[i].sections[0]) {
                  firstCourse.sections.push(contractResult[i].sections[0]);
                  contractResult.splice(i, 1);
                  i--;
              } else break;
          }
      }
      finalResult.push(firstCourse);
  }

  contractResult = JSON.parse(JSON.stringify(finalResult));
  finalResult.length = 0;
  while (contractResult.length!== 0) {
      let firstCourse = contractResult.shift();
      if (firstCourse == undefined) continue;
      let dayTag = firstCourse.day;
      for (let i = 0; contractResult[i]!== undefined && dayTag === contractResult[i].day; i++) {
          if (firstCourse.sections.sort((a, b) => a - b).toString() === contractResult[i].sections.sort((a, b) => a - b).toString() && firstCourse.name === contractResult[i].name && firstCourse.position === contractResult[i].position && firstCourse.teacher === contractResult[i].teacher) {
              firstCourse.weeks.push(contractResult[i].weeks[0]);
              contractResult.splice(i, 1);
              i--;
          }
      }
      finalResult.push(firstCourse);
  }
  return finalResult;
}

function scheduleHtmlParser(html) {
  let $ = cheerio.load(html, { decodeEntities: false });
  let result = [];
  let errorMessage = "";
  try {
      $('tbody tr').each(function (sectionIndex, _) {
          $(this).children("td").each(function (day, _) {
              let courseDiv = $(this).children('div[class="kbcontent"]');
              if (courseDiv.text().length <= 6) {
                  return;
              }
              let courseInfo = { weeks: [], sections: [] };
              let courseContentArr = courseDiv.html().split(/<br>/);
              let nameUsed = true;
              let nameAfterCount = 1;
              courseContentArr.forEach(content => {
                  $ = cheerio.load(content, { decodeEntities: false });
                  courseInfo.day = day + 1;
                  if ($("body").text().trim().length === 0) return;
                  let fontTags = $("body").children("font");
                  if (fontTags.length > 1) {
                      if (fontTags.eq(0).attr("title") === "教学楼") {
                          let buildingName = fontTags.eq(0).text().replace(/【|】/g, "");
                          if (fontTags.eq(1).text().slice(buildingName.length).search(buildingName)!== -1) {
                              fontTags.eq(1).text(fontTags.eq(1).text().slice(buildingName.length));
                          }
                      }
                      fontTags = $("font").filter('[style!="display:none;"]');
                  } else if (fontTags.length === 1 && fontTags.attr("style")!== undefined) {
                      return;
                  }
                  nameAfterCount += 1;
                  switch (!fontTags.attr("title") && nameAfterCount > 1? "课程" : fontTags.attr("title")) {
                      case "课程":
                          if (nameUsed) {
                              courseInfo.name = $("body").text();
                              courseInfo.name = courseInfo.name.replace(/\([a-z]+\d+.*?\)/, "");
                              nameUsed = false;
                              nameAfterCount = 0;
                          } else {
                              result.push(JSON.parse(JSON.stringify(courseInfo)));
                              courseInfo = { weeks: [], sections: [] };
                              nameUsed = true;
                          }
                          break;
                      case "老师":
                      case "教师":
                          courseInfo.teacher = fontTags.text();
                          break;
                      case "教室":
                          courseInfo.position = fontTags.text();
                          courseInfo.position = courseInfo.position.replace(/\(.*?\)/, "");
                          break;
                      case "教学楼":
                          courseInfo.position = fontTags.text();
                          break;
                      case "周次(节次)":
                          courseInfo.weeks = getWeeks(fontTags.text().split("[")[0]);
                          let sectionStr = fontTags.text().match(/(?<=\[).*?(?=\])/g);
                          if (sectionStr) courseInfo.sections = getSection(sectionStr[0]);
                          else {
                              for (let section = sectionIndex * 2 - 1; section <= sectionIndex * 2; section++) {
                                  courseInfo.sections.push(section);
                              }
                          }
                          break;
                  }
              });
              if (!nameUsed) {
                  result.push(JSON.parse(JSON.stringify(courseInfo)));
                  courseInfo = { weeks: [], sections: [] };
                  nameUsed = true;
              }
          });
      });
      if (result.length === 0) errorMessage = "未获取到课表";
      else result = resolveCourseConflicts(result);
  } catch (err) {
      console.error(err);
      errorMessage = err.message.slice(0, 50);
  }
  if (errorMessage.length!== 0) {
      result.length = 0;
      result.push({
          'name': "qwq",
          'teacher': "开发者",
          'position': errorMessage,
          'day': 1,
          'weeks': [1],
          'sections': [{ section: 1 }, { section: 2 }, { section: 3 }]
      });
  }
  return result;
}