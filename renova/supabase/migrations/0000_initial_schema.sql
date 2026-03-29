-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users (assumes integration with Supabase Auth, but we can maintain our own users table for profile if we want)
-- Usually Supabase Auth manages auth.users, and we keep public profiles. Let's create `users` as a profile table referencing auth.users.
CREATE TABLE users (
    id UUID PRIMARY KEY, -- references auth.users in a real app
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'merchant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. merchant_profiles
CREATE TABLE merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    business_type VARCHAR(255),
    whatsapp_number VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. stores
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_profile_id UUID REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    short_description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    accent_color VARCHAR(20),
    whatsapp_number VARCHAR(50),
    city VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'suspended'
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    published_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_user_id ON stores(user_id);

-- 4. categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 5. listings
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    short_description TEXT,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    city VARCHAR(100),
    condition_label VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, slug)
);
CREATE INDEX idx_listings_store_id ON listings(store_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_published_at ON listings(published_at);

-- 6. listing_images
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);

-- 7. listing_attributes
CREATE TABLE listing_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    attribute_key VARCHAR(100) NOT NULL,
    attribute_label_ar VARCHAR(255) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_listing_attributes_listing_id ON listing_attributes(listing_id);

-- 8. analytics_events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'store-view', 'listing-view', 'whatsapp-click', etc.
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_analytics_events_store_id ON analytics_events(store_id);
CREATE INDEX idx_analytics_events_listing_id ON analytics_events(listing_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- SEED DATA
INSERT INTO categories (key, name_ar, sort_order) VALUES
('cars', 'سيارات', 1),
('real_estate', 'عقارات', 2),
('electronics', 'إلكترونيات', 3)
ON CONFLICT (key) DO NOTHING;

-- Dev Seed (Optional, for easy testing)
-- INSERT INTO users ...
-- INSERT INTO merchant_profiles ...
-- INSERT INTO stores ...
-- INSERT INTO listings ...

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies

-- Public Read Policies
CREATE POLICY "Public profiles are viewable by everyone." ON merchant_profiles FOR SELECT USING (true);
CREATE POLICY "Public stores are viewable by everyone." ON stores FOR SELECT USING (status = 'published');
CREATE POLICY "Public categories are viewable by everyone." ON categories FOR SELECT USING (true);
CREATE POLICY "Public listings are viewable by everyone." ON listings FOR SELECT USING (status = 'published');
CREATE POLICY "Public listing images are viewable by everyone." ON listing_images FOR SELECT USING (true);
CREATE POLICY "Public listing attributes are viewable by everyone." ON listing_attributes FOR SELECT USING (true);

-- Auth user policies (Users can read/write their own data)
CREATE POLICY "Users can insert their own profile." ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own merchant profile." ON merchant_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own merchant profile." ON merchant_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store." ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own store." ON stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own draft stores." ON stores FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert listings for their stores." ON listings FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update listings for their stores." ON listings FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete listings for their stores." ON listings FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own draft listings." ON listings FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Analytics events can be inserted by anyone." ON analytics_events FOR INSERT WITH CHECK (true);
