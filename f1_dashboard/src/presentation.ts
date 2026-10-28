import type {AppState,Chapter} from './data/types';
import {preset,stateUrl} from './state';

export const STORY_STEPS=['intro','overview','circuits-field','circuits-both','recovery-top10','recovery-win','recovery-back','case-grid','case-11','case-33','case-43','case-69','closing'] as const;
export type StoryStep=typeof STORY_STEPS[number];
export const CHECKPOINTS=[0,11,33,43,69] as const;
export const CHECKPOINT_NAMES=['Grid','Early recovery','Restart order','New leader','Finish'];
export function chapterFor(step:StoryStep):Chapter {
  if(step.startsWith('circuits'))return 'circuits';
  if(step.startsWith('recovery'))return 'recovery';
  if(step.startsWith('case'))return 'case';
  return 'overview';
}
export function firstStep(chapter:Chapter):StoryStep {
  return ({overview:'overview',circuits:'circuits-field',recovery:'recovery-top10',case:'case-grid'} as const)[chapter];
}
export function stateForStep(step:StoryStep):AppState {
  const s=preset(chapterFor(step));
  if(step==='recovery-win'||step==='recovery-back')s.outcome='win';
  if(step==='recovery-back')s.selectedBand=4;
  if(step.startsWith('case'))s.caseLap=step==='case-grid'?0:Number(step.slice(5));
  return s;
}
export function adjacentStep(step:StoryStep,direction:1|-1):StoryStep {
  return STORY_STEPS[Math.max(0,Math.min(STORY_STEPS.length-1,STORY_STEPS.indexOf(step)+direction))];
}
export function readStory(search:string):StoryStep {
  const p=new URLSearchParams(search);
  const step=p.get('step') as StoryStep;
  if(STORY_STEPS.includes(step)&&(!p.has('chapter')||p.get('chapter')===chapterFor(step)))return step;
  const chapter=p.get('chapter') as Chapter;
  if(['overview','circuits','recovery','case'].includes(chapter))return firstStep(chapter);
  return 'intro';
}
export function storyUrl(state:AppState,step:StoryStep) {
  if(state.mode==='explore')return stateUrl(state);
  const params=new URLSearchParams(stateUrl(state));params.set('step',step);
  if(state.chapter==='case'&&state.caseLap!==null)params.set('lap',String(state.caseLap));
  if(state.chapter==='recovery'){params.set('outcome',state.outcome);params.set('band',String(state.selectedBand));}
  if(state.chapter==='overview'&&state.selectedStart!==null)params.set('start',String(state.selectedStart));
  return '?'+params.toString();
}
export function readPresentationState(search:string):AppState {
  const state=stateForStep(readStory(search)),p=new URLSearchParams(search);
  if(state.chapter==='case'&&p.has('lap')){const lap=Number(p.get('lap'));if(Number.isInteger(lap)&&lap>=0&&lap<=69)state.caseLap=lap;}
  if(state.chapter==='recovery'){
    const outcome=p.get('outcome');if(outcome==='top10'||outcome==='podium'||outcome==='win')state.outcome=outcome;
    if(p.has('band')){const band=Number(p.get('band'));if(Number.isInteger(band)&&band>=0&&band<=4)state.selectedBand=band;}
  }
  if(state.chapter==='overview'&&p.has('start')){const start=Number(p.get('start'));if(Number.isInteger(start)&&start>=1&&start<=22)state.selectedStart=start;}
  return state;
}
export const NEXT_LABEL:Record<StoryStep,string>={
  intro:'Explore the pattern',overview:'Compare the circuits','circuits-field':'Show wins from first','circuits-both':'Change the question',
  'recovery-top10':'Change goal: win','recovery-win':'What about farther back?','recovery-back':'Follow that race',
  'case-grid':'Lap 11: early recovery','case-11':'Lap 33: restart order','case-33':'Lap 43: a new leader','case-43':'Reveal the finish','case-69':'The takeaway',closing:'Explore the evidence',
};
