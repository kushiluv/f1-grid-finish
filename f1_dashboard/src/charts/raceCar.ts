// Original overhead racing-car illustration. Its centre is the observed lap-end rank.
export function raceCarImage(color:string){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 32"><g stroke="#FFFFFF" stroke-width="1.1" stroke-linejoin="round"><path d="M5 5h8v22H5z" fill="${color}"/><rect x="13" y="1" width="10" height="7" rx="2" fill="#26333A"/><rect x="13" y="24" width="10" height="7" rx="2" fill="#26333A"/><rect x="39" y="3" width="8" height="6" rx="1.5" fill="#26333A"/><rect x="39" y="23" width="8" height="6" rx="1.5" fill="#26333A"/><path d="M12 10h18l10 3h12v6H40l-10 3H12z" fill="${color}"/><path d="M52 6h4v20h-4z" fill="${color}"/><ellipse cx="28" cy="16" rx="5" ry="3.5" fill="#26333A"/></g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
