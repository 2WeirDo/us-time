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

-- ====== 禁用 RLS (这是两个人的私密 App，不需要行级安全) ======
ALTER TABLE couple_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;

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

-- ====== 可选：插入一条初始数据测试 ======
-- INSERT INTO couple_settings (id, my_name, partner_name, start_date, passcode)
-- VALUES (1, '男友', '女友', '2023-06-15', '1234');
