const KEY = "puzzle_progress";

export function getProgress() {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : { unlocked: [1] };
}

export function unlockLevel(n) {
  const prog = getProgress();
  if (!prog.unlocked.includes(n)) {
    prog.unlocked.push(n);
    prog.unlocked.sort((a, b) => a - b);
    localStorage.setItem(KEY, JSON.stringify(prog));
  }
}
