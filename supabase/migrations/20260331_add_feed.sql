-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  post_type text NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'audio', 'gif', 'poll')),
  media_urls text[] DEFAULT '{}',
  gif_url text,
  is_pinned boolean DEFAULT false,
  pinned_at timestamptz,
  pinned_by uuid REFERENCES public.profiles(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Poll options (separate table)
CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Poll votes
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post reactions (like + heart)
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'heart')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Comment reactions
CREATE TABLE public.comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Posts: all logged-in users can read non-deleted posts
CREATE POLICY "Members can read posts" ON public.posts
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);
CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can update any post" ON public.posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Poll options: readable by all, writable by post author
CREATE POLICY "Members can read poll options" ON public.poll_options
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can insert poll options" ON public.poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

-- Poll votes: one per user per post
CREATE POLICY "Members can read poll votes" ON public.poll_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Members can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can change vote" ON public.poll_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY "Members can read reactions" ON public.post_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Members can react" ON public.post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can unreact" ON public.post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Members can read comments" ON public.post_comments
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);
CREATE POLICY "Members can comment" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins can update comments" ON public.post_comments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Comment reactions
CREATE POLICY "Members can read comment reactions" ON public.comment_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Members can react to comments" ON public.comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can unreact to comments" ON public.comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('post-images', 'post-images', true),
  ('post-videos', 'post-videos', true),
  ('post-audio', 'post-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images
CREATE POLICY "Public read post-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Auth upload post-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Auth delete own post-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for post-videos
CREATE POLICY "Public read post-videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-videos');
CREATE POLICY "Auth upload post-videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-videos' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Auth delete own post-videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-videos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for post-audio
CREATE POLICY "Public read post-audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-audio');
CREATE POLICY "Auth upload post-audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-audio' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Auth delete own post-audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text
  );
