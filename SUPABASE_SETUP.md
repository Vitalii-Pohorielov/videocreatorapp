# Supabase Setup

1. Create `.env.local` from `.env.example`.
2. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In Supabase Auth, enable the Google provider and add these redirect URLs:
   - `http://localhost:3000/projects`
   - your production `/projects` URL
4. In Google Cloud, create a web OAuth client and copy the client ID and client secret into the Supabase Google provider settings.
5. Run the SQL from [lib/projectSchema.sql](/d:/VideoCreatorApp/lib/projectSchema.sql) in the Supabase SQL editor.
6. Restart the Next.js dev server.

After that:

- `/` is a one-screen landing page with Google sign-in.
- `/projects` is the authenticated management workspace.
- `/editor` is protected and only available after sign-in.
- `Save project` stores the scene track and export settings under the signed-in user's account.
- Uploaded images are written to `project-images/<user-id>/uploads/...`.
