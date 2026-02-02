-- Create UUID extension needed for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    query VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    advertisement_type VARCHAR(50) NOT NULL,
    position_type VARCHAR(50) NOT NULL DEFAULT 'WINDOW',
    media_url VARCHAR(1000) NOT NULL,
    link_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(is_active);

-- Sponsor Settings
CREATE TABLE IF NOT EXISTS sponsor_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rotation_strategy VARCHAR(50) NOT NULL DEFAULT 'random',
    display_duration INTEGER DEFAULT 30000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sponsor_settings (rotation_strategy, display_duration)
VALUES ('random', 30000)
ON CONFLICT DO NOTHING;

-- News Articles
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(100),
    published_at TIMESTAMP,
    image_url VARCHAR(1000),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    background_type VARCHAR(50) DEFAULT 'image',
    show_news BOOLEAN DEFAULT true,
    show_sponsors BOOLEAN DEFAULT true,
    show_history BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
