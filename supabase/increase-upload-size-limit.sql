-- Apparel production files can be larger than the original 10 MB bucket limit.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']
where id = 'herbz-images';
