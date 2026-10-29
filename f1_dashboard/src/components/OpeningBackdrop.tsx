/** Decorative circuit artwork, not a measured track map or a data display. */
export function OpeningBackdrop({revealed}:{revealed:boolean}){
 return <div className="opening-backdrop" aria-hidden="true">
  <svg className="opening-track-scene" viewBox="0 0 1500 900" preserveAspectRatio="xMinYMid slice" focusable="false">
   <defs>
    <pattern id="intro-asphalt" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#AAB9C2"/><circle cx="5" cy="5" r=".4" fill="#AAB9C2"/></pattern>
    <pattern id="intro-track-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#91AFBC" strokeWidth=".6"/></pattern>
    <pattern id="intro-finish-line" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#D4DFDF"/></pattern>
    <linearGradient id="intro-track-edge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#607781"/><stop offset=".5" stopColor="#B95745"/><stop offset="1" stopColor="#405F6B"/></linearGradient>
    <path id="intro-circuit-path" d="M-170 995 178 782C228 751 243 711 223 673L126 496C92 433 110 358 174 322L423 181C480 148 534 172 551 222L581 311C594 350 582 380 550 403L406 507C372 532 375 573 411 591L510 641C563 668 563 720 516 755L220 973"/>
   </defs>
   <rect width="1500" height="900" fill="url(#intro-asphalt)" opacity=".07"/>
   <path d="M0 0h785L540 900H0Z" fill="url(#intro-track-grid)" opacity=".12"/>
   <g className="intro-track-surface">
    <use href="#intro-circuit-path" fill="none" stroke="url(#intro-track-edge)" strokeWidth="76" opacity=".40"/>
    <use href="#intro-circuit-path" fill="none" stroke="#D3DADB" strokeWidth="67" strokeDasharray="15 15" opacity=".19"/>
    <use href="#intro-circuit-path" fill="none" stroke="#121F28" strokeWidth="58"/>
    <use href="#intro-circuit-path" fill="none" stroke="#8198A2" strokeWidth="1" opacity=".18"/>
    <use className="intro-track-trail" href="#intro-circuit-path" pathLength="1000" fill="none" stroke="#F1765D" strokeWidth="3" strokeLinecap="round"/>
   </g>
   <g opacity=".15" transform="translate(70 702) rotate(-30)"><rect width="243" height="24" fill="url(#intro-finish-line)"/><path d="M0 38H243" stroke="#F1A091" strokeWidth="2"/></g>
   <g className="intro-pit-markings" fill="none" stroke="#94A8B0" strokeWidth="2" opacity=".12">{Array.from({length:7},(_,i)=><path key={i} d={`M${88+i*34} ${834-i*21}l-12-21 30-18 12 21`}/>)}</g>
  </svg>
  <div className={`intro-start-gantry ${revealed?'lights-out':''}`}>
   <div className="gantry-crossbar"/>
   {Array.from({length:5},(_,i)=><div className="gantry-pod" key={i} style={{'--light-delay':`${250+i*220}ms`} as React.CSSProperties}><i/><i/></div>)}
  </div>
 </div>;
}
