import { Student } from "../models/student.model";
import { Teacher } from "../models/teacher.model";
import Marks from "../models/marks.model";

class MarksService {

  // SAVE / UPDATE
  async saveOrUpdate(data: any) {
    try {
      const { first_name, roll_number, teacher_id, subjects } = data;
      const exam_name = data.exam_name || 'General';

      if (!subjects || subjects.length === 0) {
        return { message: "Subjects required" };
      }

      // Find teacher by user_id (from token) or teacher_id
      let actualTeacherId = teacher_id;
      
      if (teacher_id) {
        const teacher = await Teacher.findOne({ where: { user_id: teacher_id } });
        if (teacher) {
          actualTeacherId = teacher.id;
        } else {
          // If not found by user_id, try direct teacher_id
          const teacherById = await Teacher.findByPk(teacher_id);
          if (teacherById) {
            actualTeacherId = teacher_id;
          } else {
            // Use any teacher from the system as fallback
            const anyTeacher = await Teacher.findOne();
            if (anyTeacher) {
              actualTeacherId = anyTeacher.id;
            }
          }
        }
      }

      const student = await Student.findOne({ where: { roll_number } });
      if (!student) return { message: "Student not found" };

      for (const subject of subjects) {
        try {
          const existing = await Marks.findOne({
            where: {
              student_id: student.id,
              subject_name: subject.subject_name,
              exam_name,
            },
          });

          if (existing) {
            await existing.update({
              marks_obtained: subject.marks_obtained,
              total_marks: subject.total_marks || 100,
            });
          } else {
            await Marks.create({
              student_id: student.id,
              teacher_id: actualTeacherId,
              first_name: student.first_name || "",
              roll_number: student.roll_number || "",
              subject_name: subject.subject_name,
              marks_obtained: subject.marks_obtained,
              total_marks: subject.total_marks || 100,
              exam_name,
            });
          }
        } catch (err: any) {
          if (err.name === 'SequelizeUniqueConstraintError') {
            await Marks.update(
              {
                marks_obtained: subject.marks_obtained,
                total_marks: subject.total_marks || 100,
              },
              {
                where: {
                  student_id: student.id,
                  subject_name: subject.subject_name,
                  exam_name,
                }
              }
            );
          } else {
            throw err;
          }
        }
      }

      return { message: "Marks saved/updated successfully", data: { first_name, roll_number, exam_name, subjects_count: subjects.length } };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save marks');
    }
  }

  // GET STUDENT MARKS (New - by student_id)
  async getStudentMarks(student_id: string, client_id: string, filters: any = {}) {
    const where: any = { student_id, client_id };
    
    if (filters.exam_type) where.exam_type = filters.exam_type;
    if (filters.subject) where.subject_name = filters.subject;
    if (filters.standard) where.standard = filters.standard;
    
    return Marks.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  }

  // GET STUDENT MARKS (Old - by first_name and roll_number)
  async getStudentMarksByName(first_name: string, roll_number: string) {
    const marks = await Marks.findAll({
      where: { roll_number },
      order: [['exam_name', 'ASC'], ['subject_name', 'ASC']]
    });

    const examGroups: any = {};
    marks.forEach(m => {
      if (!examGroups[m.exam_name]) {
        examGroups[m.exam_name] = [];
      }
      examGroups[m.exam_name].push({
        subject_name: m.subject_name,
        marks_obtained: m.marks_obtained,
        total_marks: m.total_marks,
        percentage: ((m.marks_obtained / m.total_marks) * 100).toFixed(2)
      });
    });

    const exams = Object.keys(examGroups).map(examName => {
      const subjects = examGroups[examName];
      const totalObtained = subjects.reduce((sum: number, s: any) => sum + s.marks_obtained, 0);
      const totalMarks = subjects.reduce((sum: number, s: any) => sum + s.total_marks, 0);
      const overallPercentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : '0.00';

      return {
        exam_name: examName,
        subjects,
        summary: {
          total_obtained: totalObtained,
          total_marks: totalMarks,
          overall_percentage: overallPercentage
        }
      };
    });

    return {
      first_name,
      roll_number,
      exams
    };
  }

  // GET SPECIFIC EXAM MARKS
  async getExamMarks(first_name: string, roll_number: string, exam_name: string) {
    const marks = await Marks.findAll({
      where: { roll_number, exam_name },
      order: [['subject_name', 'ASC']]
    });

    const subjects = marks.map(m => ({
      subject_name: m.subject_name,
      marks_obtained: m.marks_obtained,
      total_marks: m.total_marks,
      percentage: ((m.marks_obtained / m.total_marks) * 100).toFixed(2)
    }));

    const totalObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMarks = marks.reduce((sum, m) => sum + m.total_marks, 0);
    const overallPercentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : '0.00';

    return {
      first_name,
      roll_number,
      exam_name,
      subjects,
      summary: {
        total_obtained: totalObtained,
        total_marks: totalMarks,
        overall_percentage: overallPercentage
      }
    };
  }

  // GET BY ID
  async getById(id: string) {
    const mark = await Marks.findByPk(id);
    if (!mark) return { message: "Mark not found" };
    return mark;
  }

  // DELETE
  async delete(id: string) {
    const deleted = await Marks.destroy({ where: { id } });
    if (!deleted) return { message: "Mark not found" };
    return { message: "Mark deleted successfully" };
  }

  //delete all marks
  async deleteAllMarks(first_name: string, roll_number: string) {
  const deleted = await Marks.destroy({
    where: { first_name, roll_number },
  });
  if (!deleted) {
    return { message: "No marks found for this student" };
  }
  return { message: "All marks deleted successfully" };
}

  // BULK SAVE - Multiple students
  async bulkSave(data: any) {
    const { teacher_id, exam_name, students } = data;
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const result = await this.saveOrUpdate({
          ...studentData,
          teacher_id,
          exam_name: exam_name || 'General'
        });
        results.push({ 
          roll_number: studentData.roll_number, 
          success: true, 
          message: result.message 
        });
      } catch (error: any) {
        errors.push({ 
          roll_number: studentData.roll_number, 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      message: `Processed ${students.length} students`,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  // GET ALL EXAM NAMES (with optional class filter)
  async getAllExams(classes?: string) {
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../db/connection');
    
    let query: string;
    let replacements: any[] = [];
    
    if (classes) {
      const classArray = classes.split(',').map(c => c.trim());
      query = `
        SELECT DISTINCT m.exam_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.standard IN (:classes)
        AND m.exam_name IS NOT NULL
        ORDER BY m.exam_name
      `;
      replacements = classArray;
    } else {
      query = `
        SELECT DISTINCT exam_name
        FROM marks
        WHERE exam_name IS NOT NULL
        ORDER BY exam_name
      `;
    }
    
    const results = await sequelize.query(query, {
      replacements: classes ? { classes: replacements } : {},
      type: QueryTypes.SELECT
    });
    
    return results.map((row: any) => row.exam_name);
  }

  // GET TOPPERS DATA (marks for selected classes)
  async getToppersData(classes: string) {
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../db/connection');
    
    const classArray = classes.split(',').map(c => c.trim());
    
    const query = `
      SELECT 
        s.first_name,
        s.roll_number,
        s.standard,
        m.exam_name,
        m.subject_name,
        m.marks_obtained,
        m.total_marks
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.standard IN (:classes)
      ORDER BY s.standard, s.roll_number, m.exam_name
    `;
    
    const results = await sequelize.query(query, {
      replacements: { classes: classArray },
      type: QueryTypes.SELECT
    });
    
    return results;
  }
}

export default new MarksService();
