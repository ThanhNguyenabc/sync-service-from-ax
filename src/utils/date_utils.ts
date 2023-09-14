import { Time } from "../models";

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
