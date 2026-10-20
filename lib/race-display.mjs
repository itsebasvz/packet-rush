// Presentation geometry keeps every page balanced, without scrolling the race.
export function raceLayout(width, height, count) {
  const desired =
    count > 32 ? 5 : count > 24 ? 4 : count > 12 ? 3 : count > 4 ? 2 : 1;
  const columns = Math.min(
    desired,
    Math.max(1, Math.floor((width + 12) / 276)),
  );
  const capacity = columns * Math.max(1, Math.floor((height + 8) / 84));
  const pageCount = Math.max(1, Math.ceil(count / capacity));
  const pageSize = Math.max(1, Math.ceil(count / pageCount));
  const rows = Math.max(1, Math.ceil(pageSize / columns));
  const rowHeight = (height - (rows - 1) * 8) / rows;
  return {
    columns,
    rows,
    pageCount,
    pageSize,
    density:
      rowHeight < 104 ? "compact" : rowHeight < 190 ? "regular" : "spacious",
  };
}

// A snapshot refresh is not an event. Only newly answered final questions count.
export function raceEvents(previous, state) {
  const sameRoom = previous?.code === state.room.code;
  const seen = new Set(sameRoom ? previous.arrivedIds : []);
  const arrived = state.players.filter(
    (player) => player.answered >= state.room.questionCount,
  );
  const arrivals = sameRoom
    ? arrived.filter((player) => !seen.has(player.id))
    : [];
  arrived.forEach((player) => seen.add(player.id));
  const finalSeen = sameRoom && previous.finalSeen;
  const streaks = Object.fromEntries(
    state.players.map((player) => [player.id, player.streak ?? 0]),
  );
  const hot =
    sameRoom &&
    state.room.status === "running" &&
    state.room.scoringVersion !== 1
      ? state.players.filter((player) => {
          const before = previous.streaks?.[player.id] ?? player.streak ?? 0;
          return [3, 5, 8, 12].some(
            (milestone) => before < milestone && player.streak >= milestone,
          );
        })
      : [];
  const finale =
    state.room.status === "finished" && !finalSeen && state.players.length > 0;
  return {
    tracker: {
      code: state.room.code,
      arrivedIds: [...seen],
      finalSeen: finalSeen || finale,
      streaks,
    },
    arrivals: finale ? [] : arrivals,
    finale,
    hot: finale ? [] : hot,
  };
}
