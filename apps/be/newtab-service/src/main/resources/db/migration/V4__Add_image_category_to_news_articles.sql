-- Add image_url and category columns to news_articles table
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
