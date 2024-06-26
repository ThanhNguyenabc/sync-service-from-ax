import { getUsers, createUsers, updateUsers } from "@/apis/_index";
import { AXStudentProfile, User } from "@/models/_index";
import logger, { logMessage } from "@/utils/logger";
import dayjs from "dayjs";

const syncStudent = async (students: Array<AXStudentProfile>) => {
  logger.info(logMessage("start", "student", "sync students"));

  try {
    const usersMap = students?.reduce((res, item) => {
      if (item.StudentCode)
        return {
          ...res,

          [item.StudentCode]: item,
        };
      return res;
    }, {}) as { [key: string]: AXStudentProfile };

    const studentCodes = Object.keys(usersMap);

    let lmsExistingUsers = await getUsers(studentCodes).then((data) => {
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

    const updateUserList = [];
    const insertUserList = [];

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

      if (lmsExistingUsers && lmsExistingUsers[axUser.StudentCode!]) {
        userModel.id = lmsExistingUsers[axUser.StudentCode!].userId;
        updateUserList.push(userModel);
      } else {
        insertUserList.push(userModel);
      }
    }

    if (insertUserList.length > 0) {
      const status = await createUsers(insertUserList);
      status &&
        logger.info(logMessage("success", "student", "insert successfully"));
    }
    if (updateUserList.length > 0) {
      const status = await updateUsers(updateUserList);
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
