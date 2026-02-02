-- iPhone advertisement sponsors: all position_type x advertisement_type combinations
-- Media and link URLs from Apple iPhone official page (apple.com/iphone)

INSERT INTO sponsors (name, advertisement_type, position_type, media_url, link_url, is_active, created_at, updated_at)
VALUES
-- IMAGE + FULL_BACKGROUND
(
    'iPhone – Full background image',
    'IMAGE',
    'FULL_BACKGROUND',
    'https://www.apple.com/v/iphone/home/ci/images/overview/consider/designed-to_last__c3hmkknr9scy_large.jpg',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- IMAGE + WINDOW
(
    'iPhone – Window image',
    'IMAGE',
    'WINDOW',
    'https://www.apple.com/v/iphone/home/ci/images/overview/select/iphone_17__ck7zzemcw37m_large.jpg',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- LOOP_VIDEO + FULL_BACKGROUND (Apple Guided Tour HLS)
(
    'iPhone – Full background loop video',
    'LOOP_VIDEO',
    'FULL_BACKGROUND',
    'https://www.apple.com/105/media/us/iphone/2025/bf3428fe-1ccc-4e3f-a0fc-30af341431f8/films/guided-tour/iphone-guided-tour-tpl-us-2025_16x9.m3u8',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- LOOP_VIDEO + WINDOW
(
    'iPhone – Window loop video',
    'LOOP_VIDEO',
    'WINDOW',
    'https://www.apple.com/105/media/us/iphone/2025/bf3428fe-1ccc-4e3f-a0fc-30af341431f8/films/guided-tour/iphone-guided-tour-tpl-us-2025_16x9.m3u8',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- LOOP_GIF + FULL_BACKGROUND (iPhone-style animated GIF from web)
(
    'iPhone – Full background loop GIF',
    'LOOP_GIF',
    'FULL_BACKGROUND',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- LOOP_GIF + WINDOW
(
    'iPhone – Window loop GIF',
    'LOOP_GIF',
    'WINDOW',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://www.apple.com/iphone/',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
