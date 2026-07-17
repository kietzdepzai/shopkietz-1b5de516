# Export & import data to your own Supabase project

Target project: **diyucsqdeydnznrijmyt**

## 1. Create the schema

Open **Supabase Dashboard → SQL Editor** for your project and run the entire
file `supabase/migration/schema.sql` once. This creates all tables, functions,
triggers, GRANTs, RLS policies, and the `images` storage bucket.

## 2. Export data from the current shop

You have two options — pick one.

### Option A — Export from Lovable Cloud UI (recommended)

In Lovable, open **Cloud → Advanced settings → Export data**, download each
table as CSV, then in your Supabase project use **Table Editor → Import CSV**
for each table. Import in this order so foreign keys resolve cleanly:

1. `categories`
2. `products`
3. `product_accounts`
4. `discount_codes`
5. `shop_settings`
6. `ctv_assignments`
7. `profiles` *(only rows whose `user_id` exists in the new project's `auth.users`)*
8. `user_roles`
9. `orders`
10. `boost_orders`
11. `topup_requests`

### Option B — CSV via SQL (per table)

Run in **the current** project's SQL editor and copy the result:

```sql
COPY (SELECT * FROM public.categories)      TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.products)        TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.product_accounts)TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.discount_codes)  TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.shop_settings)   TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.ctv_assignments) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.profiles)        TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.user_roles)      TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.orders)          TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.boost_orders)    TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM public.topup_requests)  TO STDOUT WITH CSV HEADER;
```

Save each result as `<table>.csv`, then import in the new project via
**Table Editor → Import CSV** (same order as Option A).

## 3. Auth users

`auth.users` is managed by Supabase and cannot be inserted directly with SQL
in the Dashboard. Two ways to migrate accounts:

- **Ask users to sign up again** on the new project. The `handle_new_user`
  trigger will create their `profiles` row automatically.
- **Bulk migrate** via the Supabase Management API `POST /admin/users` for
  each user (needs the new project's service-role key from your own dashboard).

After users exist in the new `auth.users`, re-import `profiles` /
`user_roles` for those user_ids.

## 4. Storage (product & category images)

The `images` bucket is created empty by `schema.sql`. To copy files:

1. In the current project, list files: `storage.objects` where `bucket_id='images'`.
2. Download each file from the public URL
   `https://<old-ref>.supabase.co/storage/v1/object/public/images/<name>`.
3. Upload to the new project (same filename) via **Storage → images → Upload**,
   or with the Supabase JS client / `supabase storage cp`.

Product/category rows already store the full public URL, so if you want to
keep pointing at the OLD project's storage you can skip this step — the images
will keep loading from the original CDN until you rotate them.

## 5. Point the app at the new project

Update your Vite env vars:

```
VITE_SUPABASE_URL=https://diyucsqdeydnznrijmyt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from your dashboard>
VITE_SUPABASE_PROJECT_ID=diyucsqdeydnznrijmyt
```

Then redeploy. Done.
