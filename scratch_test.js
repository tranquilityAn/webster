import { buildSnapshot } from '@paranoideed/drawebster';

const snapshot = {
  className: 'Stage',
  attrs: { width: 1280, height: 720 },
  children: []
};

const commit1 = { op: 'update', id: undefined, props: { width: 1920, height: 1080 } };
const commit2 = { op: 'update', id: 'stage', props: { width: 1920, height: 1080 } };
const commit3 = { op: 'update', id: 'root', props: { width: 1920, height: 1080 } };
const commit4 = { op: 'update', props: { width: 1920, height: 1080 } }; // maybe without id?

console.log("C1:", buildSnapshot(snapshot, [commit1]).attrs);
console.log("C2:", buildSnapshot(snapshot, [commit2]).attrs);
console.log("C3:", buildSnapshot(snapshot, [commit3]).attrs);
console.log("C4:", buildSnapshot(snapshot, [commit4]).attrs);
