-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "likes_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "message_likes" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_likes_message_id_idx" ON "message_likes"("message_id");

-- CreateIndex
CREATE INDEX "message_likes_user_id_idx" ON "message_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_likes_message_id_user_id_key" ON "message_likes"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "message_likes" ADD CONSTRAINT "message_likes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
