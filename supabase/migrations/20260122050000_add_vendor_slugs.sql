-- Add slug to vendors table
alter table vendors add column if not exists slug text unique;

-- Create an index for faster lookups
create index if not exists vendors_slug_idx on vendors (slug);
