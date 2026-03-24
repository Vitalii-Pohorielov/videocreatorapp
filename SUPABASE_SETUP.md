# Supabase Setup

1. Create `.env.local` from `.env.example`.
2. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the SQL from [lib/projectSchema.sql](/d:/VideoCreatorApp/lib/projectSchema.sql) in the Supabase SQL editor.
4. Restart the Next.js dev server.

After that:

- `Save project` stores the full scene track and export settings in `public.video_projects`.
- Uploaded images go to the public storage bucket `project-images`.
- Opening `/?project=<id>` loads a saved project directly from Supabase.
