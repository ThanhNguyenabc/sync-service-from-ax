import { getUsers, createUsers, updateUsers } from "../apis";
import { AXStudentProfile, User } from "../models";
import logger from "../utils/logger";

const syncStudent = async (students: Array<AXStudentProfile>) => {
  logger.info("start sync class seats");
  try {
    const usersMap = students.reduce((res, item) => {
      if (item.StudentCode)
        return {
          ...res,

          [item.StudentCode]: item,
        };
      return res;
    }, {}) as { [key: string]: AXStudentProfile };

    const studentCodes = Object.keys(usersMap);

    let lmsExistingUsers = await getUsers(studentCodes).then((res) => {
      if (res && res.length > 0) {
        return res.reduce(
          (result, item) => ({
            ...result,
            [item.staffcode]: {
              userId: item.id,
            },
          }),
          {}
        ) as {
          [key: string]: {
            userId: number;
          };
        };
      }
      return null;
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
      status && logger.info("insert student successfully");
    }
    if (updateUserList.length > 0) {
      const status = await updateUsers(updateUserList);
      status && logger.info("update student successfully");
    }
    return true;
  } catch (error) {
    logger.error(`sync users errror --> ${error}`);
  }
  logger.info("done sync class seats");
  return false;
};

const syncTeachers = () => {};

export { syncStudent, syncTeachers };