/**
 * Guards against the crash class that took down the Create Activity screen.
 *
 * Reanimated worklets (`useAnimatedStyle`, `useAnimatedProps`,
 * `useDerivedValue`, `useAnimatedScrollHandler`) run on the UI thread. They may
 * only call functions that are themselves worklets — either declared with the
 * `'worklet'` directive or defined in the same file, where the Babel plugin can
 * workletize them. Calling an ordinary *imported* helper throws
 * "tried to synchronously call a non-worklet function on the UI thread",
 * which is survivable in development but a hard crash in a release build.
 *
 * That is exactly what shipped: `withAlpha()` was called inside a
 * `useAnimatedStyle` in the activity editor, and the release APK exited with
 * "internal error occurred" the moment that screen mounted.
 *
 * Run via `npm run check:worklets` (and in CI, before the APK is built).
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const WORKLET_HOOKS = [
  'useAnimatedStyle',
  'useAnimatedProps',
  'useDerivedValue',
  'useAnimatedScrollHandler',
  'useAnimatedReaction',
];

/**
 * Imported helpers that are NOT worklets. Anything added to `src/theme` or
 * `src/utils` that lacks a `'worklet'` directive belongs here.
 */
const FORBIDDEN = [
  'withAlpha',
  'shadow',
  'accentGradient',
  'isFuture',
  'isToday',
  'weekdayLabel',
  'friendlyDate',
  'toDayKey',
  'addDays',
  'formatDuration',
  'formatDurationShort',
  'formatMinutes',
  'formatSteps',
  'formatDistance',
  'formatCalories',
  'formatPace',
  'formatDelta',
  'distanceFromSteps',
  'caloriesBurned',
  'paceStepsPerMinute',
];

/** Extracts each worklet hook's full call expression via brace matching. */
function workletBodies(source) {
  const out = [];
  for (const hook of WORKLET_HOOKS) {
    const re = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    let m;
    while ((m = re.exec(source)) !== null) {
      const open = source.indexOf('(', m.index + hook.length - 1);
      let depth = 0;
      let i = open;
      for (; i < source.length; i += 1) {
        if (source[i] === '(') depth += 1;
        else if (source[i] === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      out.push({ index: m.index, body: source.slice(open, i + 1) });
    }
  }
  return out;
}

const files = globSync('{src,app}/**/*.{ts,tsx}', { cwd: ROOT }).map((f) => path.join(ROOT, f));

const violations = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const { index, body } of workletBodies(source)) {
    for (const name of FORBIDDEN) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(body)) {
        violations.push({
          file: path.relative(ROOT, file),
          line: source.slice(0, index).split('\n').length,
          name,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Non-worklet functions called inside Reanimated worklets:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  calls ${v.name}() on the UI thread`);
  }
  console.error(
    '\nCompute these on the JS thread and pass the result in as a plain value.\n' +
      'A worklet may only read shared values and call other worklets.\n',
  );
  process.exit(1);
}

console.log(`No worklet violations across ${files.length} files.`);
