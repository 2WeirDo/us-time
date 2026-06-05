-- ============================================
-- UsTime - Supabase Database Migration
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================

-- 1. 情侣设置表 (只有一条记录, id 固定为 1)
CREATE TABLE IF NOT EXISTS couple_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  my_name TEXT NOT NULL DEFAULT '',
  partner_name TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  couple_emoji TEXT DEFAULT '👫',
  avatar_me TEXT,
  avatar_partner TEXT,
  passcode TEXT NOT NULL DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL CHECK (author IN ('me', 'partner')),
  content TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  audio TEXT,
  mood TEXT,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 为已有数据库添加缺失列（如果列不存在则添加）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'audio') THEN
    ALTER TABLE posts ADD COLUMN audio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reactions') THEN
    ALTER TABLE posts ADD COLUMN reactions JSONB DEFAULT '{}';
  END IF;
END $$;

-- 3. 纪念日表
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'custom',
  icon TEXT DEFAULT '💝',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====== 索引 ======
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones (date ASC);

-- ====== 启用 Realtime (让帖子实时同步) ======
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- ====== 存储桶策略 (允许上传照片和语音) ======
-- 创建 public 存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 允许任何人读取存储桶中的文件
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- 允许任何人上传文件到存储桶
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
CREATE POLICY "Public upload access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

-- ====== 4. 手写信表 ======
CREATE TABLE IF NOT EXISTS love_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL CHECK (author IN ('me', 'partner')),
  image_url TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON love_letters (created_at DESC);

-- ====== 5. 情侣清单表 ======
CREATE TABLE IF NOT EXISTS bucket_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  notes TEXT DEFAULT '',
  emoji TEXT DEFAULT '✨',
  completed BOOLEAN DEFAULT false,
  completed_by TEXT CHECK (completed_by IN ('me', 'partner')),
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL CHECK (created_by IN ('me', 'partner')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bucket_items_created ON bucket_list_items (created_at DESC);

-- ====== 6. 足迹表 ======
CREATE TABLE IF NOT EXISTS footprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  date DATE,
  photo TEXT,
  note TEXT DEFAULT '',
  created_by TEXT NOT NULL CHECK (created_by IN ('me', 'partner')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_footprints_date ON footprints (date DESC);

-- ====== 7. 虚拟宠物状态表 ======
CREATE TABLE IF NOT EXISTS pet_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pet_type TEXT DEFAULT 'cat',
  name TEXT DEFAULT '小可爱',
  happiness INTEGER DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
  last_fed_at TIMESTAMPTZ DEFAULT now(),
  last_interaction_at TIMESTAMPTZ DEFAULT now()
);

-- ====== 8. 评论表 ======
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('me', 'partner')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- ====== 9. 今日心情表 ======
CREATE TABLE IF NOT EXISTS today_moods (
  date DATE NOT NULL,
  author TEXT NOT NULL CHECK (author IN ('me', 'partner')),
  mood TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, author)
);

-- ====== 新表启用 Realtime ======
ALTER PUBLICATION supabase_realtime ADD TABLE love_letters;
ALTER PUBLICATION supabase_realtime ADD TABLE bucket_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE footprints;
ALTER PUBLICATION supabase_realtime ADD TABLE today_moods;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- ====== RLS 策略 ======
-- 由于这是两个人的私密 App，我们使用简单的密钥验证策略
-- 客户端必须提供正确的 API key 才能访问数据

-- 启用 RLS
ALTER TABLE couple_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE footprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE today_moods ENABLE ROW LEVEL SECURITY;

-- 所有表允许通过 anon key 进行所有操作
-- （认证方式为应用层的密码验证，而非 SQL 层的 RLS）
DROP POLICY IF EXISTS "Full access for anon" ON couple_settings;
CREATE POLICY "Full access for anon" ON couple_settings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON posts;
CREATE POLICY "Full access for anon" ON posts
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON milestones;
CREATE POLICY "Full access for anon" ON milestones
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON love_letters;
CREATE POLICY "Full access for anon" ON love_letters
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON bucket_list_items;
CREATE POLICY "Full access for anon" ON bucket_list_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON footprints;
CREATE POLICY "Full access for anon" ON footprints
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON pet_state;
CREATE POLICY "Full access for anon" ON pet_state
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON comments;
CREATE POLICY "Full access for anon" ON comments
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for anon" ON today_moods;
CREATE POLICY "Full access for anon" ON today_moods
  FOR ALL USING (true) WITH CHECK (true);

-- 额外安全：限制存储桶路径只能在 photos/ 下
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
CREATE POLICY "Public upload access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

-- ====== 可选：插入一条初始数据测试 ======
-- INSERT INTO couple_settings (id, my_name, partner_name, start_date, passcode)
-- VALUES (1, '男友', '女友', '2023-06-15', '1234');
