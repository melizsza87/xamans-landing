-- Apply AFTER schema.sql, to a dedicated Cantalove project only.
-- Existing anonymous orders stay inaccessible: never backfill ownership by guessing.
alter table orders add column if not exists brand text not null default 'love' check (brand in ('love','heartbreak'));
alter table orders add column if not exists request_key uuid;
alter table orders add column if not exists first_play_at timestamptz;
alter table orders add column if not exists first_download_grant_at timestamptz;
alter table orders add column if not exists consent_at timestamptz;
alter table orders add column if not exists payment_status text not null default 'none';
alter table orders add column if not exists delivery_email_first_attempt_at timestamptz;
alter table orders add column if not exists delivery_email_sent_at timestamptz;
alter table orders add column if not exists delivery_claimed_at timestamptz;
create unique index if not exists orders_mp_payment_unique on orders(mp_payment_id) where mp_payment_id is not null;
create unique index if not exists orders_verified_email_free_unique on orders(lower(contact_email)) where consent_at is not null;
create unique index if not exists orders_request_key_unique on orders(request_key) where request_key is not null;
alter table songs add column if not exists track_paths text[] not null default '{}';
alter table songs add column if not exists processing_until timestamptz;
alter table songs add column if not exists submission_started_at timestamptz;
alter table songs add column if not exists provider_credits integer;
alter table personalizations add column if not exists vibe text not null default '';
-- Resolve any historical duplicate songs/personalizations before applying these indexes.
create unique index if not exists songs_order_unique on songs(order_id);
create unique index if not exists personalizations_order_unique on personalizations(order_id);
create table if not exists email_challenges(email text primary key,code_hash text not null,expires_at timestamptz not null,attempts integer not null default 0);
create table if not exists customer_sessions(token_hash text primary key,email text not null,expires_at timestamptz not null);
create table if not exists rate_limits(key text primary key,hits integer not null,expires_at timestamptz not null);
create table if not exists generation_costs(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders(id),provider text not null,model text not null,input_tokens integer not null default 0,output_tokens integer not null default 0,credits integer not null default 0,created_at timestamptz not null default now());
create table if not exists funnel_events(id uuid primary key default gen_random_uuid(),event text not null,brand text not null,created_at timestamptz not null default now());
alter table email_challenges enable row level security;
alter table customer_sessions enable row level security;
alter table rate_limits enable row level security;
alter table generation_costs enable row level security;
alter table funnel_events enable row level security;
-- RLS + explicit revoke: public API keys cannot read customer data or execute RPCs.
revoke all on orders,personalizations,songs,email_challenges,customer_sessions,rate_limits,generation_costs,funnel_events from anon,authenticated;
grant all on orders,personalizations,songs,email_challenges,customer_sessions,rate_limits,generation_costs,funnel_events to service_role;
create or replace function consume_rate_limit(bucket_key text,max_hits integer,window_seconds integer) returns boolean language plpgsql security invoker set search_path=public as $$
declare used integer;
begin
 insert into rate_limits as limits(key,hits,expires_at) values(bucket_key,1,now()+make_interval(secs=>window_seconds))
 on conflict(key) do update set hits=case when limits.expires_at<=now() then 1 else limits.hits+1 end,
 expires_at=case when limits.expires_at<=now() then now()+make_interval(secs=>window_seconds) else limits.expires_at end returning hits into used;
 return used<=max_hits;
end;$$;
create or replace function verify_email_code(customer_email text,submitted_hash text) returns boolean language plpgsql security invoker set search_path=public as $$
declare challenge email_challenges;
begin
 select * into challenge from email_challenges where email=customer_email for update;
 if not found or challenge.expires_at<=now() or challenge.attempts>=5 then return false;end if;
 if challenge.code_hash<>submitted_hash then update email_challenges set attempts=attempts+1 where email=customer_email;return false;end if;
 delete from email_challenges where email=customer_email;return true;
end;$$;
create or replace function reserve_free_order(customer_email text,request_key uuid,brief jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare order_id uuid;
begin
 -- Serialize per email across concurrent requests; order/personality/song commit atomically.
 perform pg_advisory_xact_lock(hashtextextended(customer_email,0));
 select id into order_id from orders where lower(contact_email)=lower(customer_email) and consent_at is not null;
 if found then return jsonb_build_object('id',order_id,'created',false);end if;
 if not consume_rate_limit('generation-global-day',50,86400) then return jsonb_build_object('limited',true,'created',false);end if;
 insert into orders(status,contact_email,request_key,consent_at,brand) values('generating',lower(customer_email),request_key,now(),brief->>'brand') returning id into order_id;
 insert into personalizations(order_id,occasion,names,story,genre,voice,duration,vibe) values(order_id,brief->>'occasion',brief->>'names',brief->>'story',brief->>'genre',brief->>'voice',brief->>'duration',coalesce(brief->>'vibe',''));
 insert into songs(order_id,status) values(order_id,'generating');
 return jsonb_build_object('id',order_id,'created',true);
end;$$;
revoke all on function consume_rate_limit(text,integer,integer),verify_email_code(text,text),reserve_free_order(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function consume_rate_limit(text,integer,integer),verify_email_code(text,text),reserve_free_order(text,uuid,jsonb) to service_role;
-- Ensure private bucket even if an earlier setup accidentally made it public.
update storage.buckets set public=false where id='tracks';
