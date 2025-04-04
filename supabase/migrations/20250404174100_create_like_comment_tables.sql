-- Create Like table
CREATE TABLE IF NOT EXISTS "Like" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate likes
    CONSTRAINT "Like_userId_postId_unique" UNIQUE ("userId", "postId")
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "Like_userId_idx" ON "Like" ("userId");
CREATE INDEX IF NOT EXISTS "Like_postId_idx" ON "Like" ("postId");

COMMENT ON TABLE "Like" IS 'Stores user likes on posts.';
COMMENT ON COLUMN "Like"."userId" IS 'The ID of the user who liked the post.';
COMMENT ON COLUMN "Like"."postId" IS 'The ID of the post that was liked.';

-- Create Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "Comment_userId_idx" ON "Comment" ("userId");
CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment" ("postId");

COMMENT ON TABLE "Comment" IS 'Stores user comments on posts.';
COMMENT ON COLUMN "Comment"."content" IS 'The text content of the comment.';
COMMENT ON COLUMN "Comment"."userId" IS 'The ID of the user who wrote the comment.';
COMMENT ON COLUMN "Comment"."postId" IS 'The ID of the post that was commented on.';
