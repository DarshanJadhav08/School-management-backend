import { FastifyRequest, FastifyReply } from "fastify";
import { Client } from "../models";
import { IClientCreation } from "../interface/client.interface";

interface ClientParams {
  id: string;
}

// Create client
export const createClient = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = req.body as IClientCreation;
    const client = await Client.create(body);
    reply.status(201).send({ message: "Client created successfully", data: client });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Get all clients
export const getAllClients = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const clients = await Client.findAll();
    reply.send({ data: clients });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Get client by ID
export const getClientById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as ClientParams;
    const client = await Client.findByPk(id);

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    reply.send({ data: client });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Update client
export const updateClient = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as ClientParams;
    const body = req.body as Partial<IClientCreation>;
    
    const client = await Client.findByPk(id);

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    await client.update(body);
    reply.send({ message: "Client updated successfully", data: client });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Delete client
export const deleteClient = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as ClientParams;
    const client = await Client.findByPk(id);

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    await client.destroy();
    reply.send({ message: "Client deleted successfully" });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
