-- Existing rooms keep their original scores; only new rooms enable bonuses.
alter table public.rush_rooms add column scoring_version int not null default 1 check (scoring_version in (1,2));
alter table public.rush_rooms alter column scoring_version set default 2;
alter table public.rush_answers
  add column base_points int not null default 0 check (base_points in (0,100)),
  add column speed_bonus int not null default 0 check (speed_bonus in (0,10,20,30)),
  add column streak_bonus int not null default 0 check (streak_bonus in (0,10,15,20)),
  add column streak int not null default 0 check (streak between 0 and 12);

-- Recover streak statistics without granting retroactive bonuses.
with segments as (
  select player_id, question_index, correct,
    count(*) filter(where not correct) over(partition by player_id order by question_index) segment
  from public.rush_answers
), runs as (
  select player_id, question_index,
    case when correct then count(*) filter(where correct) over(partition by player_id, segment order by question_index) else 0 end streak
  from segments
)
update public.rush_answers a set base_points=case when a.correct then 100 else 0 end, streak=r.streak
from runs r where a.player_id=r.player_id and a.question_index=r.question_index;

-- Runs inside the existing locked/idempotent command transaction, including timeouts.
-- No client-supplied score or streak is accepted.
create function public.rush_score_answer() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare v_version int; v_previous int;
begin
  new.correct := new.correct and new.elapsed_ms<45000;
  select r.scoring_version into strict v_version from rush_players p join rush_rooms r on r.id=p.room_id where p.id=new.player_id;
  select a.streak into v_previous from rush_answers a where a.player_id=new.player_id and a.question_index=new.question_index-1;
  new.streak := case when new.correct then coalesce(v_previous,0)+1 else 0 end;
  new.base_points := case when new.correct then 100 else 0 end;
  new.speed_bonus := case when not new.correct or v_version=1 then 0 when new.elapsed_ms<=5000 then 30 when new.elapsed_ms<=10000 then 20 when new.elapsed_ms<=20000 then 10 else 0 end;
  new.streak_bonus := case when new.correct and v_version>=2 and new.streak>=3 then least(20,(new.streak-1)*5) else 0 end;
  -- A timed-out response happened at the deadline, even if polling resumed later.
  if new.elapsed_ms=45000 then
    select p.question_started_at + interval '45 seconds' into new.answered_at from rush_players p where p.id=new.player_id;
  else
    new.answered_at := clock_timestamp();
  end if;
  return new;
end;
$$;
create trigger rush_score_before_insert before insert on public.rush_answers
for each row execute function public.rush_score_answer();
revoke all on function public.rush_score_answer() from public,anon,authenticated;
grant execute on function public.rush_score_answer() to service_role;

create or replace function public.rush_snapshot(p_room uuid, p_player uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare r public.rush_rooms; p public.rush_players; q jsonb; v_answer public.rush_answers; v_options jsonb; v_players jsonb; v_me jsonb;
begin
  select * into strict r from rush_rooms where id=p_room;
  with totals as (
    select x.id,x.name,x.avatar,x.avatar_color,x.question_index,
      count(a.player_id)::int answered,
      count(a.player_id) filter(where a.correct)::int correct,
      coalesce(sum(a.base_points+a.speed_bonus+a.streak_bonus),0)::int points,
      coalesce(sum(a.speed_bonus+a.streak_bonus),0)::int bonus_points,
      coalesce((array_agg(a.streak order by a.question_index desc) filter(where a.player_id is not null))[1],0)::int streak,
      coalesce(max(a.streak),0)::int best_streak,
      (coalesce(sum(a.elapsed_ms),0)+(12-count(a.player_id))*45000)::int time_ms,
      case when count(a.player_id)=12 then greatest(0,floor(extract(epoch from (max(a.answered_at)-r.started_at))*1000))::int else null end finish_time_ms
    from rush_players x left join rush_answers a on a.player_id=x.id
    where x.room_id=r.id group by x.id
  ), ranked as (
    select *,rank() over(order by points desc,time_ms asc)::int position from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'name',name,'avatar',avatar,'avatarColor',avatar_color,'answered',answered,'correct',correct,
    'points',points,'bonusPoints',bonus_points,'streak',streak,'bestStreak',best_streak,'finishTimeMs',finish_time_ms,
    'timeMs',time_ms,'rank',position,'complete',question_index>=12
  ) order by points desc,time_ms asc,lower(name)),'[]'::jsonb) into v_players from ranked;
  if p_player is not null then
    select * into strict p from rush_players where id=p_player and room_id=r.id;
    if p.question_index<12 and r.status<>'waiting' then
      q := r.questions->p.question_index;
      select jsonb_agg(o order by md5(p.id::text || ':' || p.question_index::text || ':' || (o->>'id')))
        into v_options from jsonb_array_elements(q->'options') o;
      select * into v_answer from rush_answers where player_id=p.id and question_index=p.question_index;
    end if;
    v_me := jsonb_build_object(
      'id',p.id,'index',p.question_index,'complete',p.question_index>=12,
      'deadlineAt',case when p.question_started_at is null then null else p.question_started_at+interval '45 seconds' end,
      'question',case when q is null then null else jsonb_build_object('id',q->>'id','topic',q->>'topic','prompt',q->>'prompt','options',v_options) end,
      'answer',case when v_answer.player_id is null then null else jsonb_build_object(
        'correct',v_answer.correct,'selected',v_answer.selected,'elapsedMs',v_answer.elapsed_ms,'correctOption',q->>'correctOption','explanation',q->>'explanation',
        'basePoints',v_answer.base_points,'speedBonus',v_answer.speed_bonus,'streakBonus',v_answer.streak_bonus,'streak',v_answer.streak,
        'points',v_answer.base_points+v_answer.speed_bonus+v_answer.streak_bonus
      ) end
    );
  end if;
  return jsonb_build_object('serverNow',clock_timestamp(),'room',jsonb_build_object(
    'code',r.code,'status',r.status,'questionCount',12,'capacity',40,'scoringVersion',r.scoring_version
  ),'players',v_players,'me',v_me);
end;
$$;
