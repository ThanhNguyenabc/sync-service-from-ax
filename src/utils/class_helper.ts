import { LessonOutcome } from "@/models/lesson_outcome.model";
import { TimeOff } from "@/models/timeoff.model";
import { Timeoff_Check } from "@/utils/date_utils";
import moment, { Moment } from "moment";

export function Courses_Classes_Calendar(
  date_start: Moment,
  schedule: Array<{
    day: string;
    time: string;
  }>,
  lessons: Array<string>,
  lesson_duration: number,
  timeoff: Array<TimeOff> | null,
  outcomes: LessonOutcome,
  content_duration = 2,
  firstLessonDuration: number | null = null
) {
  // CALCULATE CALENDAR USING SCHEDULE AND TIME OFF

  //Doan Nhat Nam 03/07/2023  Fix days error : Round to Ceil

  var numOfDays = Math.ceil(
    (content_duration / lesson_duration) * lessons.length
  );

  var schedule_index = 0;
  //DOAN NHAT NAM 15/11/2023 SETUP FIRST SCHEDULE INDEX
  schedule.sort(function (a, b) {
    return Number(a["day"]) - Number(b["day"]);
  });

  for (let index = 0; index < schedule.length; index++) {
    if (getDayOfWeek(date_start) <= Number(schedule[index]["day"])) {
      schedule_index = index;
      break;
    }
  }

  let calendar = [];
  let lessonDate = moment(date_start.format("YYYYMMDD"));
  //DOAN NHAT NAM 15/11/2023 SETUP FIRST SCHEDULE INDEX
  while (calendar.length < numOfDays) {
    // SCHEDULE ITEM
    var day = schedule[schedule_index % schedule.length];

    // FIND NEXT DATE WITH WEEKDAY SPECIFIED BY CURRENT SCHEDULE ITEM
    //Doan Nhat Nam 30/07/2023 set date when schedule.length = 1
    if (schedule.length == 1 && schedule_index > 0)
      lessonDate = lessonDate.add(1, "d");
    //Doan Nhat Nam 30/07/2023 set date when schedule.length = 1

    while (getDayOfWeek(lessonDate) != Number(day["day"])) {
      lessonDate = lessonDate.add(1, "d");
    }

    // CHECK THAT THE LESSON WOULDN'T BE AFFECTED BY TIMEOFF
    const date_from = lessonDate.clone().add(day["time"], "minute");
    const date_to = date_from
      .clone()
      .add(Math.floor(lesson_duration * 60), "minutes");

    // calendar.push(date_from.format("YYYYMMDDHHmm"));
    // schedule_index++;
    const dateFromStr = date_from.format("YYYYMMDDHHmm");
    const dateToStr = date_to.format("YYYYMMDDHHmm");

    if (timeoff && Timeoff_Check(dateFromStr, dateToStr, timeoff)) {
      schedule_index++;
    } else {
      calendar.push(dateFromStr);
      schedule_index++;
    }
  }

  let date_index = 0;
  let lesson_index = 0;
  let lesson_remainder = firstLessonDuration ?? content_duration;
  let session_remainder = lesson_duration;
  let lessonOutcomes = outcomes[lessons[lesson_index]] || [];

  // session = 3, lesson: 2
  let dates = [];
  let session = [];

  while (lesson_index < lessons.length) {
    // MORE TIME IS LEFT IN THE SESSION THAN IS LEFT IN THE CONTENT BLOCK
    if (session_remainder > lesson_remainder) {
      session.push({
        lesson: lessons[lesson_index],
        duration: lesson_remainder,
        outcomes: lessonOutcomes,
      });

      session_remainder = session_remainder - lesson_remainder;

      lesson_index++;
      lessonOutcomes = outcomes[lessons[lesson_index]] || [];
      lesson_remainder = getDurationFromLesson(lessons[lesson_index]);
    }
    // MORE TIME IS LEFT IN THE CONTENT BLOCK THAN IS LEFT IN THE SESSION
    else if (lesson_remainder > session_remainder) {
      // ADD A LESSON THAT TAKES ALL THE SESSION REMINDER
      session.push({
        lesson: lessons[lesson_index],
        duration: session_remainder,
        outcomes: lessonOutcomes.length > 1 ? [lessonOutcomes.shift()] : [],
      });

      dates.push({
        date: calendar[date_index],
        session,
      });

      date_index++;

      // CARRY OVER LESSON REMAINDER AND START NEW SESSION
      lesson_remainder = lesson_remainder - session_remainder;

      session = [];
      session_remainder = lesson_duration;
    }
    // TIME IN THE CONTENT BLOCK AND SESSION ARE EXACTLY THE SAME
    else {
      session.push({
        lesson: lessons[lesson_index],
        duration: lesson_remainder,
        outcomes: lessonOutcomes,
      });

      dates.push({
        date: calendar[date_index],
        session,
      });
      date_index++;

      // START NEW SESSION AND A NEW CONTENT BLOCK TOO
      lesson_index++;
      lesson_remainder = getDurationFromLesson(lessons[lesson_index]);
      lessonOutcomes = outcomes[lessons[lesson_index]] || [];
      session = [];
      session_remainder = lesson_duration;
    }
  }

  // Doan Nhat Nam 03/07/2023 : Fix dont add last lesson when lesson duration > content duration
  if (session.length > 0)
    dates.push({
      date: calendar[date_index],
      session,
    });
  // Doan Nhat Nam 03/07/2023 : Fix dont add last lesson when lesson duration > content duration

  return dates;
}

export function getDurationFromLesson(lesson: string) {
  const hour = parseInt(lesson, 10);
  return Number.isNaN(hour) ? 2 : hour;
}

function getDayOfWeek(date: Moment) {
  let dayOfWeek = date.day();
  return dayOfWeek == 0 ? 7 : dayOfWeek;
}
