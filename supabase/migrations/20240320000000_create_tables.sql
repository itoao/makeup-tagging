-- Create Category table
CREATE TABLE IF NOT EXISTS "Category" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Brand table
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "image" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Product table
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "brandId" UUID REFERENCES "Brand"("id"),
    "categoryId" UUID REFERENCES "Category"("id"),
    "imageUrl" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Post table
CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "userId" TEXT REFERENCES "User"("id"),
    "imageUrl" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tag table
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT PRIMARY KEY,
    "postId" TEXT REFERENCES "Post"("id"),
    "productId" TEXT REFERENCES "Product"("id"),
    "xPosition" INTEGER NOT NULL,
    "yPosition" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 