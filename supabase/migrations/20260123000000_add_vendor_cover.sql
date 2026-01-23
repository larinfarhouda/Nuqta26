
-- Add cover_image to vendors table
alter table vendors add column if not exists cover_image text;
