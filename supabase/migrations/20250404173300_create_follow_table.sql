-- Create Follow table to manage user follow relationships
CREATE TABLE IF NOT EXISTS "Follow" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "followerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "followingId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate follow entries
    CONSTRAINT "Follow_followerId_followingId_unique" UNIQUE ("followerId", "followingId")
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON "Follow" ("followerId");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow" ("followingId");

-- Optional: Add comments for clarity
COMMENT ON TABLE "Follow" IS 'Stores the follow relationships between users.';
COMMENT ON COLUMN "Follow"."followerId" IS 'The ID of the user who is following.';
COMMENT ON COLUMN "Follow"."followingId" IS 'The ID of the user who is being followed.';
