import {useEffect,useRef,useState} from 'react';

const MUTE_KEY='grid-finish-race-muted';

export function useRaceAudio({active,lap,playing,cueLap,finishLap,blocked}:{active:boolean;lap:number;playing:boolean;cueLap:number;finishLap:number;blocked:boolean}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const cued=useRef(false),primed=useRef(false),previousLap=useRef(lap);
  const [muted,setMuted]=useState(()=>{
    try{return localStorage.getItem(MUTE_KEY)==='true';}catch{return false;}
  });

  // Prime the same media element within Play's user gesture, including Safari.
  function prepare(){
    const audio=audioRef.current;
    if(!audio||primed.current||cued.current)return;
    primed.current=true;
    audio.volume=0;
    void audio.play().then(()=>{
      if(!cued.current){audio.pause();audio.currentTime=0;}
      audio.volume=.75;
    }).catch(()=>{audio.volume=.75;primed.current=false;});
  }

  function toggleMuted(){
    const next=!muted;
    if(audioRef.current)audioRef.current.muted=next;
    setMuted(next);
    try{localStorage.setItem(MUTE_KEY,String(next));}catch{/* Playback still works when storage is unavailable. */}
  }

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio)return;
    const rewind=lap<previousLap.current;
    previousLap.current=lap;
    if(!active||lap<cueLap||rewind){
      audio.pause();audio.currentTime=0;cued.current=false;
      return;
    }
    if(blocked){audio.pause();return;}
    if(playing){
      if(!cued.current){audio.currentTime=0;cued.current=true;}
      else if(audio.ended)return;
      audio.volume=.75;
      void audio.play().catch(()=>{cued.current=false;});
    }else if(lap<finishLap){
      audio.pause();
    }
  },[active,lap,playing,cueLap,finishLap,blocked]);

  useEffect(()=>{
    const audio=audioRef.current;
    const hidden=()=>{if(document.hidden)audio?.pause();};
    document.addEventListener('visibilitychange',hidden);
    return()=>{
      document.removeEventListener('visibilitychange',hidden);
      audio?.pause();
      cued.current=false;primed.current=false;
    };
  },[active]);

  return {audioRef,muted,prepare,toggleMuted};
}
