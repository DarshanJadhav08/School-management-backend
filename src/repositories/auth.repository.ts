import { User, Student, Teacher, Admin } from "../models";
import { sequelize } from "../db/connection";
import { generateUniqueId } from "../utils/uniqueId";

export const createUserWithRole = async (data: any) => {
  const t = await sequelize.transaction();

  try {
    console.log('Creating user with data.created_by:', data.created_by);
    
    const uniqueId = await generateUniqueId(data.role_name);
    console.log('Generated unique_id:', uniqueId);
    
    // Create user
    let user;
    try {
      user = await User.create(
        {
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          phone: data.mobile_number || data.phone,
          password: data.password,
          role_id: data.role_id,
          role_name: data.role_name,
          client_id: data.client_id,
          unique_id: uniqueId,
        },
        { transaction: t }
      );
      console.log('User created successfully:', user.id);
    } catch (userError: any) {
      console.error('❌ User creation failed:', userError.message);
      console.error('Error details:', userError.original?.message || userError.message);
      throw userError;
    }

    const createdBy = data.created_by || user.id;
    const createdOn = new Date();
    console.log('Setting created_by:', createdBy, 'created_on:', createdOn);

    // Role wise entry
    if (data.role_name === "student") {
      await Student.create(
        {
          user_id: user.id,
          client_id: data.client_id,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          parent_name: data.parent_name,
          mobile_number: data.mobile_number || data.phone,
          date_of_birth: data.date_of_birth,
          roll_number: data.roll_number,
          gender: data.gender,
          profile_image_url: data.profile_image_url,
          aadhar_number: data.aadhar_number,
          standard: data.standard,
          division: data.division,
          admission_date: data.admission_date,
          address: data.address,
          category: data.category,
          unique_id: uniqueId,
          created_by: createdBy,
          created_on: createdOn,
        },
        { transaction: t }
      );
    }

    if (data.role_name === "teacher") {
      await Teacher.create(
        {
          user_id: user.id,
          client_id: data.client_id,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          profile_image_url: data.profile_image_url,
          mobile_number: data.mobile_number || data.phone,
          designation: data.designation,
          qualification: data.qualification,
          joining_date: data.joining_date,
          experience_years: data.experience_years,
          is_class_teacher: data.is_class_teacher,
          assigned_standard: data.assigned_standard,
          assigned_division: data.assigned_division,
          unique_id: uniqueId,
          created_by: createdBy,
          created_on: createdOn,
        },
        { transaction: t }
      );
    }

    if (data.role_name === "admin") {
      await Admin.create(
        {
          user_id: user.id,
          client_id: data.client_id,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          designation: data.designation,
          mobile_number: data.mobile_number,
          profile_image_url: data.profile_image_url,
          qualification: data.qualification,
          date_of_birth: data.date_of_birth,
          experience: data.experience,
          gender: data.gender,
          unique_id: uniqueId,
          created_by: createdBy,
          created_on: createdOn,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return user;
  } catch (error: any) {
    await t.rollback();
    console.error('Error creating user:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error:', error);
    throw error;
  }
};

export const findUserByPhone = async (phone: string) => {
  if (!phone) return null;
  return User.findOne({ where: { phone } });
};

export const findUserByUniqueId = async (uniqueId: string) => {
  if (!uniqueId) return null;
  return User.findOne({ where: { unique_id: uniqueId } as any });
};
