-- Dashboard Intelligence Migration

-- 1. Add probability_pct to pipeline_stages if it does not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipeline_stages' AND column_name = 'probability_pct') THEN
        ALTER TABLE public.pipeline_stages ADD COLUMN probability_pct integer DEFAULT 0;
    END IF;
END $$;

-- 2. Update default probabilities based on common sales pipelines
UPDATE public.pipeline_stages SET probability_pct = 5 WHERE sort_order = 1;
UPDATE public.pipeline_stages SET probability_pct = 15 WHERE sort_order = 2;
UPDATE public.pipeline_stages SET probability_pct = 50 WHERE sort_order = 3;
UPDATE public.pipeline_stages SET probability_pct = 80 WHERE sort_order = 4;
UPDATE public.pipeline_stages SET probability_pct = 100 WHERE sort_order = 5;

-- 3. Create function for Pipeline Leakage
create or replace function public.get_pipeline_leakage(
    p_start_date timestamptz default '2000-01-01'::timestamptz,
    p_end_date timestamptz default '2100-01-01'::timestamptz,
    p_source text default null
) returns table (
    stage_id uuid,
    stage_name text,
    sort_order int,
    current_leads bigint,
    entered_leads bigint,
    avg_days_in_stage numeric
) language plpgsql security definer as $$
begin
    return query
    with lead_filter as (
        select id from public.leads 
        where created_at >= p_start_date and created_at <= p_end_date
        and (p_source is null or source = p_source)
    ),
    current_counts as (
        select l.stage_id, count(*) as count
        from public.leads l
        join lead_filter lf on l.id = lf.id
        group by l.stage_id
    ),
    entered_events as (
        select (pe.payload->>'new_stage_id')::uuid as stage_id, pe.lead_id
        from public.lead_events pe
        join lead_filter lf on pe.lead_id = lf.id
        where pe.event_type = 'stage_changed'
        
        union
        
        select l.stage_id, l.id as lead_id
        from public.leads l
        join lead_filter lf on l.id = lf.id
    ),
    entered_counts as (
        select ee.stage_id, count(distinct ee.lead_id) as count
        from entered_events ee
        where ee.stage_id is not null
        group by ee.stage_id
    )
    select 
        s.id as stage_id,
        s.name as stage_name,
        s.sort_order,
        coalesce(cc.count, 0)::bigint as current_leads,
        coalesce(ec.count, 0)::bigint as entered_leads,
        0.0::numeric as avg_days_in_stage 
    from public.pipeline_stages s
    left join current_counts cc on s.id = cc.stage_id
    left join entered_counts ec on s.id = ec.stage_id
    order by s.sort_order;
end;
$$;

-- 4. Create function for Agent Performance Leaderboard (single-user / overall mock for now)
-- Since it's single-user, we will aggregate overall, but we will group by something like source or create a dummy user.
create or replace function public.get_agent_performance(
    p_start_date timestamptz default '2000-01-01'::timestamptz,
    p_end_date timestamptz default '2100-01-01'::timestamptz
) returns table (
    agent_id text,
    agent_name text,
    total_leads bigint,
    won_leads bigint,
    efficiency_score numeric,
    total_revenue numeric,
    avg_time_to_close numeric
) language plpgsql security definer as $$
begin
    return query
    with base as (
        select 
            'Admin'::text as agent_name, 
            'admin_uuid'::text as agent_id,
            count(*) as total_leads,
            count(*) filter (where l.status ilike '%won%' or l.status ilike '%ganado%') as won_leads,
            sum(coalesce(l.estimated_value, 0)) filter (where l.status ilike '%won%' or l.status ilike '%ganado%') as total_revenue
        from public.leads l
        where l.created_at >= p_start_date and l.created_at <= p_end_date
    )
    select 
        b.agent_id,
        b.agent_name,
        b.total_leads::bigint,
        b.won_leads::bigint,
        case when b.total_leads > 0 then round((b.won_leads::numeric / b.total_leads::numeric) * 100, 2) else 0 end as efficiency_score,
        coalesce(b.total_revenue, 0)::numeric as total_revenue,
        0.0::numeric as avg_time_to_close
    from base b;
end;
$$;

-- 5. Create function for Revenue Forecast
create or replace function public.get_revenue_forecast(
    p_start_date timestamptz default '2000-01-01'::timestamptz,
    p_end_date timestamptz default '2100-01-01'::timestamptz
) returns table (
    stage_id uuid,
    stage_name text,
    sort_order int,
    probability_pct int,
    total_value numeric,
    weighted_value numeric
) language plpgsql security definer as \$\$
begin
    return query
    select 
        s.id as stage_id,
        s.name as stage_name,
        s.sort_order,
        coalesce(s.probability_pct, 0) as probability_pct,
        coalesce(sum(l.estimated_value), 0)::numeric as total_value,
        (coalesce(sum(l.estimated_value), 0) * (coalesce(s.probability_pct, 0)::numeric / 100.0))::numeric as weighted_value
    from public.pipeline_stages s
    left join public.leads l on s.id = l.stage_id 
        and l.created_at >= p_start_date 
        and l.created_at <= p_end_date
        and l.status != 'lost' and l.status != 'discarded'
    group by s.id, s.name, s.sort_order, s.probability_pct
    order by s.sort_order;
end;
\$\$;
