import { Time } from "@/models/_index";

export const LMS_TIME_FORMAT = "YYYYMMDDHHmm";

export const DAY_OF_WEEk = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export const getHourMinuteFromString = (input: string) => {
  const strings = input.split(":");
  return {
    hour: Number(strings?.[0] || 0),
    minute: Number(strings?.[1] || 0),
    second: Number(strings?.[2] || 0),
  };
};

export const addPrefixToTime = (time: number) => {
  return time < 10 ? `0${time}` : `${time}`;
};

export const formatHour = (time: Time) => {
  const hour = addPrefixToTime(time.hour || 0);
  const minute = addPrefixToTime(time.minute || 0);
  return `${hour}${minute}`;
};

export const convertHourToMinute = (hour: number, minute: number) => {
  return hour * 60 + minute;
};

export const generateSchedule = (
  input: string,
  time: {
    hour: number;
    minute: number;
  }
) => {
  const days = input.split("/");

  return days.map((item) => ({
    day: DAY_OF_WEEk[(item as keyof typeof DAY_OF_WEEk) || 1],
    time: convertHourToMinute(time.hour, time.minute),
  }));
};

function Date_Complete(date: string) {
  // MISSING TIME?
  if (date.length >= 8 && date.length < 14) return date.padEnd(14, "0");
  return "";
}

export function Date_Portion(date: string, mode: string, complete?: boolean) {
  let portion = date;
  switch (mode) {
    case "no-seconds":
      portion = date.substr(0, 12);
      break;

    case "date-only":
      portion = date.substr(0, 8);
      break;

    case "time-only":
      portion = date.substr(8, 4);
      break;

    case "time-timecode":
      portion = date.substr(8, 2) + ":" + date.substr(10, 2);
      break;

    case "time-seconds":
      portion = date.substr(8);
      break;
  }

  if (complete) portion = Date_Complete(portion);  

  return portion;
}

export function Timeoff_Check(
  date_from: string,
  date_to: string,
  data: Array<{
    date_from: string;
    date_to: string;
  }>
) {
  // CHECK INTERVAL?
  if (date_from && date_to) {
    for (var item of data) {
      var overlap = Numbers_Range_Intersect(
        { from: date_from, to: date_to },
        { from: item["date_from"], to: item["date_to"] }
      );
      if (overlap) return true;
    }
  }
  return false;
}

function Numbers_Within(x: any, a: any, b: any)
{
 return x > a && x < b;
}



function Numbers_Range_Intersect(ra: any, rb: any)
{
 return Numbers_Within(ra["from"], rb["from"], rb["to"]) || Numbers_Within(ra["to"],   rb["from"], rb["to"]) || Numbers_Within(rb["from"], ra["from"], ra["to"]) || Numbers_Within(rb["to"], ra["from"], ra["to"]);
}

