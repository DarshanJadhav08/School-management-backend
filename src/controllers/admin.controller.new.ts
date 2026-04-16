import { FastifyRequest, FastifyReply } from "fastify";
import {
  addAdminService,
  getAllAdminsService,
  getAdminByIdService,
  getAdminProfileService,
  updateAdminService,
  deleteAdminService,
} from "../services/admin.service";
import { NotificationService } from "../services/notification.service";

export const addAdminController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const body = req.body as any;
    const adminData = { ...body, client_id };
    const admin = await addAdminService(adminData);

    // SuperAdmin la: "नवीन admin जोडला गेला"
    try {
      const adminName = `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'New Admin';
      await NotificationService.sendToSuperAdmins(
        "नवीन admin जोडला गेला",
        `नवीन admin नोंदणी केली: "${adminName}".`,
        { type: "admin_added", client_id }
      );
    } catch (notifyError) {
      console.error("Failed to send admin notification:", notifyError);
    }

    return reply.status(201).send({
      message: "Admin added successfully",
      admin,
    });
  } catch (error: any) {
    console.error("Error in addAdminController:", error);
    return reply.status(500).send({
      error: "Failed to add admin",
      details: error.message,
    });
  }
};

export const getAllAdminsController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const query = req.query as any;
    const filters = { ...query, client_id };
    const result = await getAllAdminsService(filters);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in getAllAdminsController:", error);
    return reply.status(500).send({
      error: "Failed to fetch admins",
      details: error.message,
    });
  }
};

export const getAdminByIdController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { admin_id } = req.params as any;
    const admin = await getAdminByIdService(admin_id);
    return reply.status(200).send(admin);
  } catch (error: any) {
    console.error("Error in getAdminByIdController:", error);
    return reply.status(404).send({
      error: "Admin not found",
      details: error.message,
    });
  }
};

export const getAdminProfileController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user_id = req.user?.user_id as string;
    
    if (!user_id) {
      return reply.status(401).send({
        error: "Unauthorized",
        details: "User ID not found in token",
      });
    }
    
    const admin = await getAdminProfileService(user_id);
    return reply.status(200).send({
      message: "Admin profile fetched successfully",
      admin
    });
  } catch (error: any) {
    console.error("Error in getAdminProfileController:", error);
    return reply.status(404).send({
      error: "Admin profile not found",
      details: error.message,
    });
  }
};

export const updateAdminController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { admin_id } = req.params as any;
    const result = await updateAdminService(admin_id, req.body);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in updateAdminController:", error);
    return reply.status(500).send({
      error: "Failed to update admin",
      details: error.message,
    });
  }
};

export const deleteAdminController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { admin_id } = req.params as any;
    const result = await deleteAdminService(admin_id);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in deleteAdminController:", error);
    return reply.status(500).send({
      error: "Failed to delete admin",
      details: error.message,
    });
  }
};
