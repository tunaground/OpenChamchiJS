import { prisma } from "@/lib/prisma";
import {
  BoardRepository,
  BoardData,
  CreateBoardInput,
  UpdateBoardInput,
  ConfigBoardInput,
} from "@/lib/repositories/interfaces/board";

export const boardRepository: BoardRepository = {
  async findAll(): Promise<BoardData[]> {
    return prisma.board.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "asc" },
    });
  },

  async findById(id: string): Promise<BoardData | null> {
    return prisma.board.findUnique({ where: { id } });
  },

  async create(data: CreateBoardInput): Promise<BoardData> {
    return prisma.board.create({ data });
  },

  async update(id: string, data: UpdateBoardInput): Promise<BoardData> {
    return prisma.board.update({ where: { id }, data });
  },

  async updateConfig(id: string, data: ConfigBoardInput): Promise<BoardData> {
    return prisma.board.update({ where: { id }, data });
  },
};
