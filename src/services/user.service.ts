import { getUsers, createUsers, updateUsers } from "@/apis/_index";
import { AXStudentProfile, User } from "@/models/_index";
import logger, { logMessage } from "@/utils/logger";
import dayjs from "dayjs";

const syncStudent = async (students: Array<AXStudentProfile>) => {
  logger.info(logMessage("start", "student", "sync students"));

  try {
    // Filter data to ensure that there is no duplicate data row
    const usersMap = students?.reduce((res, item) => {
      if (item.StudentCode)
        return {
          ...res,

          [item.StudentCode]: item,
        };
      return res;
    }, {}) as { [key: string]: AXStudentProfile };

    const studentCodes = Object.keys(usersMap);
    let lmsStudents = await getUsers(studentCodes).then((data) => {
      return (
        data?.reduce((result, item) => {
          if (item.staffcode && item.id) {
            result[item.staffcode] = {
              userId: item.id,
            };
          }
          return result;
        }, {} as { [key: string]: { userId: number } }) ?? null
      );
    });

    const updatingUsers = [];
    const newUsers = [];

    for (let i = 0; i < studentCodes.length; i++) {
      const axUser = usersMap[studentCodes[i]];

      const userModel: User = {
        status: "active",
        role: "student",
        center: axUser.Center,
        firstname: axUser.FirstName,
        lastname: axUser.LastName,
        midname: axUser.MiddleName,
        email: axUser.Email,
        mobile: axUser.MobilePhone,
        address: axUser.Address,
        staffcode: axUser.StudentCode,
        birthdate: Number(dayjs(axUser.DOB).format("YYYYMMDD")),
      };

      if (lmsStudents && lmsStudents[axUser.StudentCode!]) {
        userModel.id = lmsStudents[axUser.StudentCode!].userId;
        updatingUsers.push(userModel);
      } else {
        newUsers.push(userModel);
      }
    }

    if (newUsers.length > 0) {
      const status = await createUsers(newUsers);
      status &&
        logger.info(logMessage("success", "student", "insert successfully"));
    }
    if (updatingUsers.length > 0) {
      const status = await updateUsers(updatingUsers);
      status &&
        logger.info(logMessage("success", "student", "update successfully"));
    }
    return true;
  } catch (error) {
    logger.error(logMessage("error", "student", (error as Error).stack ?? ""));
  }
  return false;
};

export { syncStudent };
