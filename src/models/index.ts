import { sequelize } from "../db/connection";
import { User } from "./users.model";
import { Role } from "./role.model";
import { Client } from "./client.model";
import { Student } from "./student.model";
import { Teacher } from "./teacher.model";
import { Admin } from "./admin.model";
import { Attendance } from "./attendance.model";
import { Homework } from "./homework.model";
import { Notice } from "./notice.model";
import { Complaint } from "./complaint.model";

// User relationships
User.belongsTo(Role, { foreignKey: "role_id" });
User.belongsTo(Client, { foreignKey: "client_id" });

// Student relationships
Student.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });
Student.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Teacher relationships
Teacher.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });
Teacher.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Admin relationships
Admin.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });
Admin.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Attendance relationships
Attendance.belongsTo(Client, { foreignKey: "client_id", as: "client", onDelete: "CASCADE" });
Attendance.belongsTo(Student, { foreignKey: "student_id", as: "student", onDelete: "CASCADE" });
Attendance.belongsTo(Teacher, { foreignKey: "teacher_id", as: "teacher" });

// Homework relationships
Homework.belongsTo(Teacher, { foreignKey: "teacher_id", as: "teacher" });
Homework.belongsTo(Client, { foreignKey: "client_id", as: "client" });

// Notice relationships
Notice.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// Complaint relationships
Complaint.belongsTo(Student, { foreignKey: "student_id", as: "student", onDelete: "CASCADE" });
Complaint.belongsTo(Client, { foreignKey: "client_id", as: "client" });
Complaint.belongsTo(User, { foreignKey: "responded_by", as: "responder" });

export {
  sequelize,
  User,
  Role,
  Client,
  Student,
  Teacher,
  Admin,
  Attendance,
  Homework,
  Notice,
  Complaint,
};
