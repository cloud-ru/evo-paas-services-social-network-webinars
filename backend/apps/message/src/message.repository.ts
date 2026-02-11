import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@app/prisma-message';

@Injectable()
export class MessageRepository {
  private readonly logger = new Logger(MessageRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.MessageCreateInput) {
    this.logger.log(`Saving message to database: ${JSON.stringify(data)}`);
    return this.prisma.message.create({
      data,
    });
  }

  async findConversation(
    user1Id: string,
    user2Id: string,
    limit: number,
    offset: number,
  ) {
    this.logger.log(
      `Finding conversation between ${user1Id} and ${user2Id} with limit ${limit} and offset ${offset}`,
    );
    const whereCondition: Prisma.MessageWhereInput = {
      OR: [
        { senderId: user1Id, recipientId: user2Id },
        { senderId: user2Id, recipientId: user1Id },
      ],
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          likes: {
            where: { userId: user1Id },
            select: { userId: true },
          },
        },
      }),
      this.prisma.message.count({ where: whereCondition }),
    ]);

    return { messages, total };
  }
  async findById(id: string) {
    this.logger.log(`Finding message by id: ${id}`);
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async softDelete(id: string) {
    this.logger.log(`Soft deleting message: ${id}`);
    return this.prisma.message.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async searchMessages(
    user1Id: string,
    user2Id: string,
    query: string,
    limit: number,
    offset: number,
  ) {
    this.logger.log(
      `Searching messages between ${user1Id} and ${user2Id} with query "${query}"`,
    );
    const whereCondition: Prisma.MessageWhereInput = {
      OR: [
        { senderId: user1Id, recipientId: user2Id },
        { senderId: user2Id, recipientId: user1Id },
      ],
      content: {
        contains: query,
        mode: 'insensitive',
      },
      isDeleted: false,
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          likes: {
            where: { userId: user1Id },
            select: { userId: true },
          },
        },
      }),
      this.prisma.message.count({ where: whereCondition }),
    ]);

    return { messages, total };
  }

  async findConversations(userId: string, limit: number, offset: number) {
    this.logger.log(
      `Finding conversations for user ${userId} with limit ${limit} and offset ${offset}`,
    );

    // Get distinct conversation partners with their last message
    const conversations = await this.prisma.$queryRaw<
      Array<{
        partner_id: string;
        last_message_id: string;
        last_message_content: string;
        last_message_sender_id: string;
        last_message_created_at: Date;
        unread_count: bigint;
      }>
    >`
      WITH conversation_partners AS (
        SELECT DISTINCT
          CASE
            WHEN sender_id = ${userId} THEN recipient_id
            ELSE sender_id
          END AS partner_id
        FROM messages
        WHERE (sender_id = ${userId} OR recipient_id = ${userId})
          AND is_deleted = false
      ),
      last_messages AS (
        SELECT DISTINCT ON (partner_id)
          cp.partner_id,
          m.id AS last_message_id,
          m.content AS last_message_content,
          m.sender_id AS last_message_sender_id,
          m.created_at AS last_message_created_at
        FROM conversation_partners cp
        INNER JOIN messages m ON (
          (m.sender_id = ${userId} AND m.recipient_id = cp.partner_id)
          OR (m.sender_id = cp.partner_id AND m.recipient_id = ${userId})
        )
        WHERE m.is_deleted = false
        ORDER BY cp.partner_id, m.created_at DESC
      ),
      unread_counts AS (
        SELECT
          sender_id AS partner_id,
          COUNT(*)::bigint AS unread_count
        FROM messages
        WHERE recipient_id = ${userId}
          AND read_at IS NULL
          AND is_deleted = false
        GROUP BY sender_id
      )
      SELECT
        lm.partner_id,
        lm.last_message_id,
        lm.last_message_content,
        lm.last_message_sender_id,
        lm.last_message_created_at,
        COALESCE(uc.unread_count, 0::bigint) AS unread_count
      FROM last_messages lm
      LEFT JOIN unread_counts uc ON lm.partner_id = uc.partner_id
      ORDER BY lm.last_message_created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count of conversations
    const totalResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT CASE
        WHEN sender_id = ${userId} THEN recipient_id
        ELSE sender_id
      END)::bigint AS count
      FROM messages
      WHERE (sender_id = ${userId} OR recipient_id = ${userId})
        AND is_deleted = false
    `;

    const total = Number(totalResult[0]?.count || 0);

    return {
      conversations: conversations.map((conv) => ({
        partnerId: conv.partner_id,
        lastMessage: {
          id: conv.last_message_id,
          content: conv.last_message_content,
          senderId: conv.last_message_sender_id,
          createdAt: conv.last_message_created_at,
        },
        unreadCount: Number(conv.unread_count),
      })),
      total,
    };
  }

  /**
   * Count all unread messages for a user across all conversations
   */
  async countUnread(userId: string): Promise<number> {
    this.logger.log(`Counting unread messages for user ${userId}`);
    const count = await this.prisma.message.count({
      where: {
        recipientId: userId,
        readAt: null,
        isDeleted: false,
      },
    });
    return count;
  }
}
