-- All access goes through the Next.js server using the secret/service_role key.
create table public.rush_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  status text not null default 'waiting' check (status in ('waiting','running','finished')),
  questions jsonb not null check (jsonb_array_length(questions) = 12),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  started_at timestamptz,
  finished_at timestamptz
);
create table public.rush_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rush_rooms on delete cascade,
  session_hash text not null,
  name text not null check (char_length(name) between 2 and 20),
  avatar text not null check (avatar in ('packet','robot','rocket','computer')),
  question_index int not null default 0 check (question_index between 0 and 12),
  question_started_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (room_id, session_hash)
);
create unique index rush_player_name on public.rush_players(room_id, lower(name));
create table public.rush_answers (
  player_id uuid not null references public.rush_players on delete cascade,
  question_index int not null check (question_index between 0 and 11),
  selected text,
  correct boolean not null,
  elapsed_ms int not null check (elapsed_ms between 0 and 45000),
  answered_at timestamptz not null default now(),
  primary key (player_id, question_index)
);
create table public.rush_login_attempts (
  identity_hash text primary key,
  failures int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rush_rooms enable row level security;
alter table public.rush_players enable row level security;
alter table public.rush_answers enable row level security;
alter table public.rush_login_attempts enable row level security;
revoke all on public.rush_rooms, public.rush_players, public.rush_answers, public.rush_login_attempts from anon, authenticated;
grant all on public.rush_rooms, public.rush_players, public.rush_answers, public.rush_login_attempts to service_role;

-- A small persistent limiter for the host password, independent of instances.
create function public.rush_login(p_identity text, p_success boolean)
returns boolean language plpgsql set search_path = public, pg_temp as $$
declare v public.rush_login_attempts;
begin
  insert into rush_login_attempts(identity_hash) values(p_identity) on conflict do nothing;
  select * into v from rush_login_attempts where identity_hash = p_identity for update;
  if v.window_start < clock_timestamp() - interval '15 minutes' then
    update rush_login_attempts set failures=0, window_start=clock_timestamp() where identity_hash=p_identity;
    v.failures := 0;
  end if;
  if v.failures >= 10 then return false; end if;
  if p_success then
    delete from rush_login_attempts where identity_hash=p_identity;
  else
    update rush_login_attempts set failures=failures+1 where identity_hash=p_identity;
  end if;
  return true;
end;
$$;

create function public.rush_snapshot(p_room uuid, p_player uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare r public.rush_rooms; p public.rush_players; q jsonb; v_answer public.rush_answers; v_options jsonb; v_players jsonb; v_me jsonb;
begin
  select * into strict r from rush_rooms where id=p_room;
  with totals as (
    select x.id, x.name, x.avatar, x.question_index,
      count(a.player_id)::int answered,
      count(a.player_id) filter(where a.correct)::int correct,
      (coalesce(sum(a.elapsed_ms),0) + (12-count(a.player_id))*45000)::int time_ms
    from rush_players x left join rush_answers a on a.player_id=x.id
    where x.room_id=r.id group by x.id
  ), ranked as (
    select *, rank() over(order by correct desc, time_ms asc)::int position from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'name',name,'avatar',avatar,'answered',answered,'correct',correct,
    'points',correct*100,'timeMs',time_ms,'rank',position,'complete',question_index>=12
  ) order by correct desc,time_ms asc,lower(name)), '[]'::jsonb) into v_players from ranked;
  if p_player is not null then
    select * into strict p from rush_players where id=p_player and room_id=r.id;
    if p.question_index < 12 and r.status <> 'waiting' then
      q := r.questions->p.question_index;
      select jsonb_agg(o order by md5(p.id::text || ':' || p.question_index::text || ':' || (o->>'id')))
        into v_options from jsonb_array_elements(q->'options') o;
      select * into v_answer from rush_answers where player_id=p.id and question_index=p.question_index;
    end if;
    v_me := jsonb_build_object(
      'id',p.id,'index',p.question_index,'complete',p.question_index>=12,
      'deadlineAt',case when p.question_started_at is null then null else p.question_started_at + interval '45 seconds' end,
      'question',case when q is null then null else jsonb_build_object('id',q->>'id','topic',q->>'topic','prompt',q->>'prompt','options',v_options) end,
      'answer',case when v_answer.player_id is null then null else jsonb_build_object(
        'correct',v_answer.correct,'selected',v_answer.selected,'elapsedMs',v_answer.elapsed_ms,'correctOption',q->>'correctOption','explanation',q->>'explanation'
      ) end
    );
  end if;
  return jsonb_build_object('serverNow',clock_timestamp(),'room',jsonb_build_object(
    'code',r.code,'status',r.status,'questionCount',12,'capacity',40
  ),'players',v_players,'me',v_me);
end;
$$;

create function public.rush_command(p_action text, p_payload jsonb, p_session text, p_host boolean default false)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  r public.rush_rooms; p public.rush_players; q jsonb; v_index int; v_choice text; v_ms int; v_now timestamptz;
begin
  if p_action='create' then
    if not p_host then raise exception 'HOST_REQUIRED'; end if;
    insert into rush_rooms(code,questions) values(p_payload->>'code',p_payload->'questions') returning * into r;
    return rush_snapshot(r.id,null);
  end if;
  -- Always lock the room before a player. Shared locks let 40 answers run in parallel;
  -- exclusive locks serialize capacity checks, start, close and next/final completion.
  if p_action in ('join','start','finish','next') then
    select * into r from rush_rooms where code=p_payload->>'code' for update;
  else
    select * into r from rush_rooms where code=p_payload->>'code' for share;
  end if;
  if r.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.expires_at <= clock_timestamp() then raise exception 'ROOM_EXPIRED'; end if;
  select * into p from rush_players where room_id=r.id and session_hash=p_session for update;
  if p_action='join' then
    if p.id is not null then return rush_snapshot(r.id,p.id); end if;
    if r.status <> 'waiting' then raise exception 'JOIN_CLOSED'; end if;
    if (select count(*) from rush_players where room_id=r.id) >= 40 then raise exception 'ROOM_FULL'; end if;
    insert into rush_players(room_id,session_hash,name,avatar)
      values(r.id,p_session,p_payload->>'name',p_payload->>'avatar') returning * into p;
  elsif p_action in ('start','finish') then
    if not p_host then raise exception 'HOST_REQUIRED'; end if;
    if p_action='start' and r.status='waiting' then
      if not exists(select 1 from rush_players where room_id=r.id) then raise exception 'ROOM_EMPTY'; end if;
      v_now := clock_timestamp();
      update rush_rooms set status='running',started_at=v_now where id=r.id;
      update rush_players set question_started_at=v_now where room_id=r.id;
    elsif p_action='finish' and r.status <> 'finished' then
      update rush_rooms set status='finished',finished_at=clock_timestamp() where id=r.id;
    end if;
  else
    if p.id is null and not p_host then raise exception 'PLAYER_REQUIRED'; end if;
    if p_action not in ('state','answer','next') then raise exception 'INVALID_ACTION'; end if;
    -- Polling also finalizes elapsed questions, so refreshing cannot reset a clock.
    if p.id is not null and r.status='running' and p.question_index<12 then
      if p.question_started_at + interval '45 seconds' <= clock_timestamp() then
        insert into rush_answers(player_id,question_index,selected,correct,elapsed_ms)
          values(p.id,p.question_index,null,false,45000) on conflict do nothing;
      end if;
    end if;
    if p_action in ('answer','next') then
      if p.id is null then raise exception 'PLAYER_REQUIRED'; end if;
      v_index := (p_payload->>'index')::int;
      if p_action='answer' then
        -- Retry after a lost response is safe, even if the player has continued.
        if not exists(select 1 from rush_answers where player_id=p.id and question_index=v_index) then
          if r.status <> 'running' then raise exception 'NOT_RUNNING'; end if;
          if v_index <> p.question_index or p.question_index>=12 then raise exception 'STALE_QUESTION'; end if;
          q := r.questions->p.question_index;
          v_choice := p_payload->>'choice';
          if v_choice is not null and not exists(select 1 from jsonb_array_elements(q->'options') o where o->>'id'=v_choice) then raise exception 'INVALID_CHOICE'; end if;
          v_now := clock_timestamp();
          v_ms := least(45000,greatest(0,floor(extract(epoch from (v_now-p.question_started_at))*1000)))::int;
          insert into rush_answers(player_id,question_index,selected,correct,elapsed_ms)
            values(p.id,p.question_index,case when v_ms<45000 then v_choice else null end,
              coalesce(v_ms<45000 and v_choice=q->>'correctOption',false),v_ms);
        end if;
      else
        if r.status='running' and p.question_index=v_index then
          if not exists(select 1 from rush_answers where player_id=p.id and question_index=v_index) then raise exception 'ANSWER_FIRST'; end if;
          update rush_players set question_index=question_index+1,
            question_started_at=case when question_index+1<12 then clock_timestamp() else null end where id=p.id;
          if not exists(select 1 from rush_players where room_id=r.id and question_index<12) then
            update rush_rooms set status='finished',finished_at=clock_timestamp() where id=r.id;
          end if;
        end if;
      end if;
    end if;
  end if;
  return rush_snapshot(r.id,p.id);
end;
$$;

revoke all on function public.rush_login(text,boolean) from public,anon,authenticated;
revoke all on function public.rush_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.rush_command(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.rush_login(text,boolean),public.rush_snapshot(uuid,uuid),public.rush_command(text,jsonb,text,boolean) to service_role;
