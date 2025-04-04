-- Create Save table for bookmarking posts
CREATE TABLE IF NOT EXISTS "Save" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate saves by the same user for the same post
    CONSTRAINT "Save_userId_postId_unique" UNIQUE ("userId", "postId")
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "Save_userId_idx" ON "Save" ("userId");
CREATE INDEX IF NOT EXISTS "Save_postId_idx" ON "Save" ("postId");

-- Add comments for clarity
COMMENT ON TABLE "Save" IS 'Stores user saves (bookmarks) on posts.';
COMMENT ON COLUMN "Save"."userId" IS 'The ID of the user who saved the post.';
COMMENT ON COLUMN "Save"."postId" IS 'The ID of the post that was saved.';
