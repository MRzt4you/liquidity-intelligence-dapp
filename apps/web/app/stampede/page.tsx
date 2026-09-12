'use client';
import {useEffect,useMemo,useState} from 'react';

type Row=Record<string,any>;
const API=process.env.NEXT_PUBLIC_API_URL||'';
const base=()=>API||window.location.origin;
const short=(x:any)=>x?`${String(x).slice(0,6)}…${String(x).slice(-6)}`:'—';
const fmt=(x:any)=>typeof x==='number'?x.toLocaleString(undefined,{maximumFractionDigits:3}):'—';

export default function StampedePage(){
 const [radar,setRadar]=useState<Row[]>([]),[rot,setRot]=useState<Row[]>([]),[status,setStatus]=useState<Row>({}),[token,setToken]=useState(''),[flow,setFlow]=useState<Row|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let stop=false;const load=async()=>{try{const b=base();const [r,x,s]=await Promise.all([fetch(b+'/api/stampede/radar?window=1800&span=1800&limit=50',{cache:'no-store'}),fetch(b+'/api/stampede/rotations?window=1800&limit=200',{cache:'no-store'}),fetch(b+'/api/stampede/status?window=1800',{cache:'no-store'})]);if(stop)return;setRadar((await r.json()).rows||[]);setRot((await x.json()).rows||[]);setStatus(await s.json())}catch{}finally{if(!stop)setLoading(false)}};load();const t=setInterval(load,5000);return()=>{stop=true;clearInterval(t)}},[]);
 const selected=useMemo(()=>token.trim(),[token]);
 const loadFlow=async()=>{if(!selected)return;try{const r=await fetch(base()+'/api/stampede/flow?token='+encodeURIComponent(selected),{cache:'no-store'});setFlow(await r.json())}catch{setFlow(null)}};
 return <main className="stampedePage"><div className="stampedeGrid"><header className="stampedeHead"><div><div className="crumb">HANZI / PUMP.FUN / STAMPEDE</div><h1>WALLET ROTATION RADAR</h1><p>STAMPEDE-style observed sell → buy intelligence, adapted to Pump.fun Solana. Ranking is evidence, not prediction.</p></div><div className="stampedeStatus"><b>{loading?'SCANNING':'LIVE ENGINE'}</b><span>{status.pumpTrades||0} trades · {status.rotations||0} rotations</span></div></header>
 <section className="stampedeNotice"><b>OBSERVED ONLY</b><span>Wallet order, timestamps and transaction hashes are shown when the feed provides them. A rotation does not prove common ownership or that the sale funded the later purchase.</span></section>
 <section className="stampedeCards"><Card n={radar.length} l="RADAR COINS"/><Card n={rot.length} l="OBSERVED ROTATIONS"/><Card n={radar.filter(x=>x.score>=60).length} l="STRONG OBSERVED"/><Card n={radar.filter(x=>x.evidenceKnown).length} l="FLOW KNOWN"/></section>
 <section className="stampedePanel"><div className="spTitle"><b>EARLY ROTATION RADAR</b><span>30m · direct + clean sequences</span></div>{radar.length?<div className="spTable"><table><thead><tr><th>#</th><th>TOKEN</th><th>SCORE</th><th>WALLETS</th><th>SOURCES</th><th>ACCEL</th><th>INFLOW</th><th>AGE</th></tr></thead><tbody>{radar.map((r,i)=><tr key={r.token}><td>{i+1}</td><td><b>{short(r.token)}</b><small>{r.token}</small></td><td><strong>{r.score}</strong></td><td>{r.wallets}</td><td>{r.breadth}</td><td>{r.acceleration}×</td><td>{fmt(r.inflowQuote)}</td><td>{r.ageS<60?`${r.ageS}s`:r.ageS<3600?`${Math.floor(r.ageS/60)}m`:`${Math.floor(r.ageS/3600)}h`}</td></tr>)}</tbody></table></div>:<Empty/>}</section>
 <section className="stampedePanel"><div className="spTitle"><b>ROTATION EVIDENCE</b><span>latest observed sequences</span></div>{rot.length?<div className="spTable"><table><thead><tr><th>WALLET</th><th>SELL</th><th>BUY</th><th>GAP</th><th>GRADE</th><th>TX</th></tr></thead><tbody>{rot.slice(0,100).map((r,i)=><tr key={i}><td className="mono">{short(r.wallet)}</td><td className="mono">{short(r.sellToken)}</td><td className="mono">{short(r.buyToken)}</td><td>{r.gapS}s</td><td><b>{String(r.grade).toUpperCase()}</b></td><td className="mono">{short(r.buyTx||r.sellTx)}</td></tr>)}</tbody></table></div>:<Empty text="NO ROTATION DATA — waiting for real Pump.fun trade flow."/>}</section>
 <section className="stampedePanel"><div className="spTitle"><b>FLOW / EGO MAP DATA</b><span>choose a CA to inspect incoming and outgoing wallet routes</span></div><div className="flowInput"><input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste Pump.fun token CA"/><button onClick={loadFlow}>LOAD FLOW</button></div>{flow&&<div className="flowCols"><Flow title="INCOMING SOURCES" rows={flow.incoming||[]} side="token"/><Flow title="OUTGOING DESTINATIONS" rows={flow.outgoing||[]} side="token"/></div>}</section>
 </div></main>
}
function Card({n,l}:{n:any,l:string}){return <div className="spCard"><small>{l}</small><strong>{n}</strong></div>}
function Empty({text='NO DATA — waiting for real blockchain events.'}:{text?:string}){return <div className="spEmpty"><b>{text}</b><span>No synthetic values are inserted.</span></div>}
function Flow({title,rows,side}:{title:string,rows:Row[],side:string}){return <div className="flowBox"><b>{title}</b>{rows.length?rows.slice(0,12).map((r,i)=><div key={i}><span className="mono">{short(r[side])}</span><strong>{r.wallets} wallets</strong></div>):<Empty text="NO OBSERVED ROUTES"/>}</div>}
