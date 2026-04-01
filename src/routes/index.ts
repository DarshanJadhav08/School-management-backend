import { FastifyInstance } from "fastify";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import teacherRoutes from "./teacher.routes";
import studentRoutes from "./student.routes";
import adminRoutes from "./admin.routes.new";
import attendanceRoutes from "./attendance.routes";
import homeworkRoutes from "./homework.routes";
import marksRoutes from "./marks.routes";
import noticeRoutes from './notice.routes';
import schoolClassRoutes from './schoolClass.route';
import complaintRoutes from './complaint.routes';
import profileRoutes from './profile.routes';
import clientRoutes from './client.routes';
import bookRoutes from "./book.routes";
import timetableRoutes from "./timetable.routes";

export default async function routes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/auth" });
  app.register(userRoutes, { prefix: "/users" });
  app.register(teacherRoutes, { prefix: "/teachers" });
  app.register(studentRoutes, { prefix: "/students" });
  app.register(adminRoutes, { prefix: "/admins" });
  app.register(attendanceRoutes, { prefix: "/attendance" });
  app.register(homeworkRoutes, { prefix: "/homework" });
  app.register(marksRoutes, { prefix: "/marks" });
  app.register(noticeRoutes, { prefix: "/notice" });
  app.register(schoolClassRoutes, { prefix: "/classes" });
  app.register(complaintRoutes, { prefix: "/complaints" });
  app.register(profileRoutes, { prefix: "/profile" });
  app.register(clientRoutes, { prefix: "/clients" });
  app.register(bookRoutes, { prefix: "/books" });
  app.register(timetableRoutes, { prefix: "/timetable" });
}
