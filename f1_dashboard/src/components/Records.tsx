import {useState} from 'react';
import type {DriverRace} from '../data/types';
import {downloadCsv,fmt} from '../data/metrics';
import {Icon} from './Icon';
export function Records({rows,title}:{rows:DriverRace[];title:string}) {
  const [page,setPage]=useState(0);const size=40;
  return <><div className="table-toolbar"><p><strong>{fmt(rows.length)}</strong> driver–race records · {title}</p><button className="text-button" onClick={()=>downloadCsv(rows)}><Icon name="download"/>Download CSV</button></div>
    <div className="data-table"><table><caption className="sr-only">Underlying driver–race data. Row selections do not change dashboard denominators.</caption><thead><tr><th>Race</th><th>Driver</th><th>Team</th><th>Grid</th><th>Finish</th><th>Status / note</th></tr></thead><tbody>{rows.slice(page*size,(page+1)*size).map(r=><tr key={`${r.race_id}-${r.driver_id}`}><td>{r.year} · {r.circuit_name}</td><td>{r.driver_name}</td><td>{r.constructor_id.replaceAll('-',' ')}</td><td>{r.grid??(r.grid_text==='PL'?'Pit lane':'—')}</td><td>{r.finish??'—'}</td><td>{r.is_finisher?'Finished':r.status}{r.reason_retired?` · ${r.reason_retired}`:''}</td></tr>)}</tbody></table></div>
    {!rows.length&&<p className="empty-note">No records in this selection.</p>}
    <div className="pagination"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{rows.length?`${page*size+1}–${Math.min((page+1)*size,rows.length)} of ${fmt(rows.length)}`:'0 records'}</span><button disabled={(page+1)*size>=rows.length} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </>;
}
