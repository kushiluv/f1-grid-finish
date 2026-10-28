export function Icon({name,size=18}:{name:string;size?:number}) {
  const paths:Record<string,React.ReactNode>={
    arrow:<><path d="M4 12h15M13 5l7 7-7 7"/></>,
    chevron:<path d="m9 5 7 7-7 7"/>,
    down:<path d="m6 9 6 6 6-6"/>,
    reset:<><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>,
    expand:<><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/></>,
    close:<path d="m6 6 12 12M18 6 6 18"/>,
    share:<><path d="M8 12v8h12V8h-8M12 4h8v8M20 4 8 16"/></>,
    notes:<><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/></>,
    grid:<><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></>,
    track:<path d="M6 5c-5 3-3 8 2 8h6c6 0 6 6 0 6H7c-5 0-5-5-1-6l10-3c6-2 4-8-1-7Z"/>,
    target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    flag:<><path d="M5 21V3m0 1c4-4 10 4 14 0v10c-4 4-10-4-14 0"/></>,
    check:<path d="m5 12 4 4L19 6"/>,
    table:<><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M10 4v16"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.info}</svg>;
}
