-- Run server-side, aggregate results only. Never export histories/emails/lyrics.
select event, brand, count(*) as events from funnel_events
where created_at >= now()-interval '30 days' group by event,brand order by event,brand;

-- Cohort conversion: orders first played; payment status remains verified by MP.
select brand,count(*) filter(where first_play_at is not null) as listened_orders,
count(*) filter(where first_play_at is not null and payment_status='approved') as buyers_after_listening,
round(100.0*count(*) filter(where first_play_at is not null and payment_status='approved') /
nullif(count(*) filter(where first_play_at is not null),0),2) as listen_to_buy_pct,
count(*) filter(where first_download_grant_at is not null) as download_authorizations
from orders where created_at >= now()-interval '30 days' group by brand;

-- Usage/cost inputs; join to invoices + selected model rates outside analytics.
select provider,model,count(*) as recorded_calls,sum(input_tokens) as input_tokens,
sum(output_tokens) as output_tokens,sum(credits) as estimated_submission_credits
from generation_costs group by provider,model;
select sum(provider_credits) as actual_music_credits from songs;
-- generation_costs stores initial estimates; songs.provider_credits is provider-reported
-- on completed/failed jobs. Do not add both together. Confirm refunds on account invoice.
-- Downloads measure authorization issuance, not proof of completed device transfer.
