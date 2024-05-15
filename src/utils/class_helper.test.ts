import { Courses_Classes_Calendar } from "@/utils/class_helper";

import moment from "moment";

const lessons = [
  "2hsj-02-034",
  "2hsj-02-035",
  "2hsj-02-036",
  "2hsj-02-037",
  "2hsj-02-038",
  "2hsj-02-039",
  "2hsj-02-040",
  "2hsj-02-041",
  "2hsj-02-042",
  "2hsj-02-043",
  "2hsj-02-044",
  "2hsj-02-045",
  "2hsj-02-046",
  "2hsj-02-047",
  "2hsj-02-048",
  "2hsj-02-049",
  "2hsj-02-050",
  "2hsj-02-051",
  "2hsj-02-052",
  "2hsj-02-053",
  "2hsj-02-054",
  "2hsj-02-055",
  "2hsj-02-056",
  "2hsj-02-057",
  "2hsj-02-058",
  "2hsj-02-059",
  "2hsj-02-060",
  "2hsj-02-061",
  "2hsj-02-062",
  "2hsj-02-063",
  "2hsj-02-064",
  "2hsj-02-065",
  "2hsj-02-066",
];

const schedules = [
  { day: "6", time: "450" },
  { day: "7", time: "450" },
];

const date_start = moment("2023/08/27", "YYYY/MM/DD");
console.log("----------abc---------", date_start.toString());
const lessons_duration = 2;
const timeoff = <any>[];
const programDuration = 2;

const classes = Courses_Classes_Calendar(
  date_start,
  schedules,
  lessons,
  lessons_duration,
  timeoff,
  programDuration
);

console.log(classes);
console.log(classes.length);
