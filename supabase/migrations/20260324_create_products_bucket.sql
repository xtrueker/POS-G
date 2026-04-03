insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

create policy "Product images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'products' );

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'products' );

create policy "Authenticated users can update product images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'products' );

create policy "Authenticated users can delete product images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'products' );
