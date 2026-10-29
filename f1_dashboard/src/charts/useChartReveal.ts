import {useEffect,useRef} from 'react';

export type RevealPart={element:Element|null;frames:Keyframe[];duration:number;delay?:number};

/** Animate only the rendered SVG. Data, tooltips and exported values stay exact. */
export function useChartReveal(token:string|number,parts:(root:HTMLDivElement)=>RevealPart[],animateOnMount=false){
  const root=useRef<HTMLDivElement>(null),seen=useRef<string|number|undefined>(animateOnMount?undefined:token),active=useRef<Animation[]>([]);
  function stop(){
    active.current.forEach(a=>a.cancel());active.current=[];
    root.current?.removeAttribute('data-animating');
    root.current?.removeAttribute('aria-busy');
  }
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>{if(media.matches)stop();};
    media.addEventListener('change',changed);
    return()=>{media.removeEventListener('change',changed);stop();};
  },[]);
  function afterPlot(){
    // A redraw (resize, new cohort, another selection) always restores final marks.
    stop();
    if(seen.current===token)return;
    seen.current=token;
    if(!root.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const plans=parts(root.current).filter(p=>p.element);
    if(!plans.length)return;
    root.current.dataset.animating='true';
    root.current.setAttribute('aria-busy','true');
    const animations=plans.map(p=>p.element!.animate(p.frames,{duration:p.duration,delay:p.delay??0,easing:'linear',fill:'both'}));
    active.current=animations;
    Promise.allSettled(animations.map(a=>a.finished)).then(()=>{
      if(active.current===animations)stop();
    });
  }
  return {root,afterPlot};
}

export const fadeIn:Keyframe[]=[{opacity:0},{opacity:1}];
