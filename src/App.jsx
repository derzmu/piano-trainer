import { useState, useRef, useEffect } from "react";

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const ALL_ROOTS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const ROOT_TO_ST = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11};

const MAJOR_INT = [0,2,4,5,7,9,11];
const MINOR_INT = [0,2,3,5,7,8,10];
const SCALES = [];
ALL_ROOTS.forEach(root => {
  const r = ROOT_TO_ST[root];
  SCALES.push({id:`${root}_maj`,label:`${root} Dur`,root,type:'major',semitones:MAJOR_INT.map(i=>(r+i)%12)});
  SCALES.push({id:`${root}_min`,label:`${root} Moll`,root,type:'minor',semitones:MINOR_INT.map(i=>(r+i)%12)});
});

const CHORD_TYPES = [
  {id:'maj',   group:'Dreiklänge',  label:'Dur',              abbr:'',      intervals:[0,4,7]},
  {id:'min',   group:'Dreiklänge',  label:'Moll',             abbr:'m',     intervals:[0,3,7]},
  {id:'dim',   group:'Dreiklänge',  label:'Vermindert',       abbr:'dim',   intervals:[0,3,6]},
  {id:'aug',   group:'Dreiklänge',  label:'Übermäßig',        abbr:'aug',   intervals:[0,4,8]},
  {id:'sus2',  group:'Dreiklänge',  label:'Sus2',             abbr:'sus2',  intervals:[0,2,7]},
  {id:'sus4',  group:'Dreiklänge',  label:'Sus4',             abbr:'sus4',  intervals:[0,5,7]},
  {id:'dom7',  group:'Septakkorde', label:'Dominant 7',       abbr:'7',     intervals:[0,4,7,10]},
  {id:'maj7',  group:'Septakkorde', label:'Major 7',          abbr:'maj7',  intervals:[0,4,7,11]},
  {id:'min7',  group:'Septakkorde', label:'Minor 7',          abbr:'m7',    intervals:[0,3,7,10]},
  {id:'dim7',  group:'Septakkorde', label:'Vermindert 7',     abbr:'dim7',  intervals:[0,3,6,9]},
  {id:'hdim7', group:'Septakkorde', label:'Halbvermindert 7', abbr:'ø7',    intervals:[0,3,6,10]},
  {id:'mmaj7', group:'Septakkorde', label:'Minor Major 7',    abbr:'mMaj7', intervals:[0,3,7,11]},
  {id:'add9',  group:'Erweitert',   label:'Add 9',            abbr:'add9',  intervals:[0,4,7,2]},
  {id:'maj9',  group:'Erweitert',   label:'Major 9',          abbr:'maj9',  intervals:[0,4,7,11,2]},
  {id:'min9',  group:'Erweitert',   label:'Minor 9',          abbr:'m9',    intervals:[0,3,7,10,2]},
  {id:'dom9',  group:'Erweitert',   label:'Dominant 9',       abbr:'9',     intervals:[0,4,7,10,2]},
  {id:'dom11', group:'Erweitert',   label:'Dominant 11',      abbr:'11',    intervals:[0,4,7,10,2,5]},
  {id:'maj11', group:'Erweitert',   label:'Major 11',         abbr:'maj11', intervals:[0,4,7,11,2,5]},
  {id:'min11', group:'Erweitert',   label:'Minor 11',         abbr:'m11',   intervals:[0,3,7,10,2,5]},
];

const CHORDS = [];
ALL_ROOTS.forEach(root => {
  const r = ROOT_TO_ST[root];
  CHORD_TYPES.forEach(ct => {
    CHORDS.push({
      id:`${root}_${ct.id}`, label:`${root} ${ct.label}`, display:`${root}${ct.abbr}`,
      root, group:ct.group, typeLabel:ct.label,
      semitones: new Set(ct.intervals.map(i=>(r+i)%12))
    });
  });
});

const OCTAVES = 2, WW = 52, WH = 200, BW = 32, BH = 124;
const WHITE_ST = [0,2,4,5,7,9,11];
const BLACK_POS = {1:0.6, 3:1.6, 6:3.6, 8:4.6, 10:5.6};
const SVG_W = OCTAVES * 7 * WW;
const GREEN = '#4ade80', GREEN_TEXT = '#166534';
const CHORD_GROUPS = ['Dreiklänge','Septakkorde','Erweitert'];

function keyId(oct, st) { return `${oct}_${st}`; }

function Toggle({ label, value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
      <div style={{width:40,height:22,borderRadius:11,background:value?'#111827':'#d1d5db',position:'relative',transition:'background 0.2s',flexShrink:0}}>
        <div style={{position:'absolute',top:3,left:value?19:3,width:16,height:16,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s'}}/>
      </div>
      <span style={{fontSize:13,fontWeight:500,color:'#6b7280'}}>{label}</span>
    </div>
  );
}

function TopNav({ view, onChange }) {
  return (
    <div style={{display:'flex',background:'#f3f4f6',borderRadius:12,padding:4,marginBottom:32,gap:2}}>
      {[['scales','Tonleitern'],['chords','Akkorde']].map(([v,label])=>(
        <button key={v} onClick={()=>onChange(v)} style={{
          padding:'8px 28px',borderRadius:9,border:'none',cursor:'pointer',fontWeight:600,fontSize:14,
          background:view===v?'#fff':'transparent',color:view===v?'#111827':'#9ca3af',
          boxShadow:view===v?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s'
        }}>{label}</button>
      ))}
    </div>
  );
}

function SearchableChordSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.toLowerCase();
  const filtered = q ? CHORDS.filter(c => c.label.toLowerCase().includes(q) || c.display.toLowerCase().includes(q)) : CHORDS;

  const grouped = CHORD_GROUPS.map(g => ({
    group: g, items: filtered.filter(c => c.group === g)
  })).filter(g => g.items.length > 0);

  const select = chord => { onChange(chord); setOpen(false); setQuery(''); };
  const open_ = () => { setOpen(true); setTimeout(()=>inputRef.current?.focus(),0); };

  return (
    <div ref={ref} style={{position:'relative',minWidth:220}}>
      <div onClick={open_} style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:10,
        padding:'10px 14px',cursor:'pointer',fontWeight:500,fontSize:14,
        boxShadow:'0 1px 4px rgba(0,0,0,0.06)',userSelect:'none',
        borderColor: open ? '#111827' : '#e5e7eb'
      }}>
        <span style={{color:'#111827'}}>{value.label}</span>
        <span style={{color:'#9ca3af',marginLeft:8,fontSize:12}}>{open?'▲':'▾'}</span>
      </div>
      {open && (
        <div style={{
          position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,zIndex:100,
          background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:12,
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)',overflow:'hidden'
        }}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid #f3f4f6'}}>
            <input
              ref={inputRef}
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Akkord suchen…"
              style={{width:'100%',border:'none',outline:'none',fontSize:14,color:'#111827',background:'transparent',boxSizing:'border-box'}}
            />
          </div>
          <div style={{maxHeight:240,overflowY:'auto'}}>
            {grouped.length === 0 && (
              <div style={{padding:'12px 16px',color:'#9ca3af',fontSize:13}}>Keine Ergebnisse</div>
            )}
            {grouped.map(({group, items}) => (
              <div key={group}>
                <div style={{padding:'6px 14px 4px',fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:'1px',textTransform:'uppercase',background:'#fafafa',borderBottom:'1px solid #f3f4f6'}}>
                  {group}
                </div>
                {items.map(c => (
                  <div key={c.id} onClick={()=>select(c)} style={{
                    padding:'9px 16px',fontSize:14,cursor:'pointer',
                    background: c.id===value.id ? '#f3f4f6' : 'transparent',
                    fontWeight: c.id===value.id ? 600 : 400,
                    color:'#111827',
                    display:'flex',justifyContent:'space-between',alignItems:'center'
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                  onMouseLeave={e=>e.currentTarget.style.background=c.id===value.id?'#f3f4f6':'transparent'}>
                    <span>{c.label}</span>
                    <span style={{color:'#9ca3af',fontSize:12,fontFamily:'monospace'}}>{c.display}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Piano({ semitones, mode, userSel, showResult, showNames, onToggle }) {
  const whites=[], blacks=[];
  const selectedST = new Set([...userSel].map(k=>parseInt(k.split('_')[1])));
  for (let oct=0; oct<OCTAVES; oct++) {
    WHITE_ST.forEach((st,wi) => {
      const id = keyId(oct,st);
      const inScale = semitones.has(st), selected = userSel.has(id);
      const stCorrect = selectedST.has(st) && inScale;
      let fill, textFill;
      if (mode==='learn') { fill=inScale?GREEN:'#fff'; textFill=inScale?GREEN_TEXT:'#c4c4c4'; }
      else if (showResult) { fill=inScale&&stCorrect?GREEN:inScale&&!stCorrect?'#f87171':!inScale&&selected?'#fca5a5':'#fff'; textFill=inScale&&stCorrect?'#fff':'#c4c4c4'; }
      else { fill=selected?'#d1d5db':'#fff'; textFill=selected?'#6b7280':'#c4c4c4'; }
      const x = (oct*7+wi)*WW;
      whites.push(
        <g key={id} onClick={()=>onToggle(oct,st)} style={{cursor:mode==='quiz'&&!showResult?'pointer':'default'}}>
          <rect x={x+1} y={0} width={WW-2} height={WH} rx={7} fill={fill} stroke="#d1d5db" strokeWidth={1.5}/>
          {showNames && <text x={x+WW/2} y={WH-14} textAnchor="middle" fontSize={11} fontWeight={700} fill={textFill}>{NOTES[st]}</text>}
        </g>
      );
    });
    Object.entries(BLACK_POS).forEach(([stStr,frac]) => {
      const st=parseInt(stStr), id=keyId(oct,st);
      const inScale=semitones.has(st), selected=userSel.has(id), stCorrect=selectedST.has(st)&&inScale;
      let fill;
      if (mode==='learn') fill=inScale?GREEN:'#1a1a1a';
      else if (showResult) fill=inScale&&stCorrect?GREEN:inScale&&!stCorrect?'#f87171':!inScale&&selected?'#fca5a5':'#1a1a1a';
      else fill=selected?'#374151':'#1a1a1a';
      const x=(oct*7+frac)*WW;
      blacks.push(
        <g key={id} onClick={()=>onToggle(oct,st)} style={{cursor:mode==='quiz'&&!showResult?'pointer':'default'}}>
          <rect x={x} y={0} width={BW} height={BH} rx={5} fill={fill} stroke="#e5e7eb" strokeWidth={0.5}/>
          {mode==='quiz'&&selected&&!showResult&&<circle cx={x+BW/2} cy={BH-16} r={4} fill="#9ca3af"/>}
          {showNames&&mode==='learn'&&inScale&&<text x={x+BW/2} y={BH-10} textAnchor="middle" fontSize={9} fontWeight={700} fill={GREEN_TEXT}>{NOTES[st]}</text>}
          {showNames&&showResult&&inScale&&stCorrect&&<text x={x+BW/2} y={BH-10} textAnchor="middle" fontSize={9} fill="#fff">{NOTES[st]}</text>}
        </g>
      );
    });
  }
  return <svg width={SVG_W} height={WH} style={{display:'block',userSelect:'none'}}>{whites}{blacks}</svg>;
}

function SimpleDropdown({ value, onChange, children }) {
  return (
    <div style={{position:'relative'}}>
      <select value={value} onChange={onChange} style={{appearance:'none',background:'#fff',color:'#111827',border:'1.5px solid #e5e7eb',borderRadius:10,padding:'10px 40px 10px 16px',fontSize:14,cursor:'pointer',fontWeight:500,outline:'none',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        {children}
      </select>
      <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af'}}>▾</span>
    </div>
  );
}

export default function App() {
  const [view, setView]             = useState('scales');
  const [scale, setScale]           = useState(SCALES[0]);
  const [scaleMode, setScaleMode]   = useState('learn');
  const [userSel, setUserSel]       = useState(new Set());
  const [showResult, setShowResult] = useState(false);
  const [chord, setChord]           = useState(CHORDS[0]);
  const [showNames, setShowNames]   = useState(true);

  const changeView      = v => { setView(v); setUserSel(new Set()); setShowResult(false); };
  const changeScale     = s => { setScale(s); setUserSel(new Set()); setShowResult(false); };
  const changeScaleMode = m => { setScaleMode(m); setUserSel(new Set()); setShowResult(false); };
  const randomScale     = () => changeScale(SCALES[Math.floor(Math.random()*SCALES.length)]);
  const randomChord     = () => setChord(CHORDS[Math.floor(Math.random()*CHORDS.length)]);

  const toggleKey = (oct, st) => {
    if (scaleMode!=='quiz'||showResult) return;
    const id=keyId(oct,st);
    setUserSel(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  };

  const selectedST   = new Set([...userSel].map(id=>parseInt(id.split('_')[1])));
  const scaleCorrect = scale.semitones.filter(st=>selectedST.has(st)).length;
  const scaleWrong   = [...selectedST].filter(st=>!scale.semitones.includes(st)).length;
  const perfect      = showResult && scaleCorrect===scale.semitones.length && scaleWrong===0;

  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',color:'#111827',fontFamily:'"Inter",system-ui,sans-serif',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 16px'}}>

      <TopNav view={view} onChange={changeView}/>

      {view==='scales' && <>
        <div style={{textAlign:'center',marginBottom:28}}>
          <h1 style={{fontSize:26,fontWeight:800,margin:0,letterSpacing:'-0.5px'}}>Tonleitern</h1>
          <p style={{color:'#9ca3af',fontSize:13,margin:'4px 0 0'}}>{scaleMode==='learn'?'Grün markierte Tasten gehören zur Tonleiter':'Klicke alle Töne der angezeigten Tonleiter'}</p>
        </div>
        <div style={{display:'flex',background:'#f3f4f6',borderRadius:12,padding:4,marginBottom:28,gap:2}}>
          {[['learn','Lernen'],['quiz','Quiz']].map(([m,label])=>(
            <button key={m} onClick={()=>changeScaleMode(m)} style={{padding:'8px 28px',borderRadius:9,border:'none',cursor:'pointer',fontWeight:600,fontSize:14,background:scaleMode===m?'#fff':'transparent',color:scaleMode===m?'#111827':'#9ca3af',boxShadow:scaleMode===m?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s'}}>{label}</button>
          ))}
        </div>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:52,fontWeight:900,letterSpacing:'-2px',lineHeight:1}}>{scale.label}</div>
          <div style={{color:'#d1d5db',fontSize:12,marginTop:8,letterSpacing:'2px',textTransform:'uppercase',fontWeight:500}}>{scale.type==='major'?'Durtonleiter':'Molltonleiter'}</div>
        </div>
        <div style={{background:'#fff',borderRadius:20,padding:'20px 28px 28px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',marginBottom:28,overflowX:'auto',maxWidth:'100%'}}>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}><Toggle label="Tonnamen" value={showNames} onChange={setShowNames}/></div>
          <Piano semitones={new Set(scale.semitones)} mode={scaleMode} userSel={userSel} showResult={showResult} showNames={showNames} onToggle={toggleKey}/>
        </div>
        {scaleMode==='quiz'&&!showResult&&(
          <button onClick={()=>selectedST.size>0&&setShowResult(true)} style={{background:selectedST.size>0?'#111827':'#f3f4f6',color:selectedST.size>0?'#fff':'#9ca3af',border:'none',borderRadius:12,padding:'13px 40px',cursor:selectedST.size>0?'pointer':'default',fontWeight:700,fontSize:15,boxShadow:selectedST.size>0?'0 2px 12px rgba(0,0,0,0.12)':'none',marginBottom:8}}>Ergebnis prüfen</button>
        )}
        {scaleMode==='quiz'&&showResult&&(
          <div style={{textAlign:'center',marginBottom:8}}>
            <div style={{fontSize:32,fontWeight:800,marginBottom:4}}>{perfect?'🎉 Perfekt!':`${scaleCorrect} / ${scale.semitones.length}`}</div>
            <div style={{display:'flex',gap:16,justifyContent:'center',fontSize:13,marginBottom:20}}>
              {scaleWrong>0&&<span style={{color:'#f87171',fontWeight:600}}>{scaleWrong} falsch gesetzt</span>}
              {scale.semitones.length-scaleCorrect>0&&<span style={{color:'#9ca3af',fontWeight:500}}>{scale.semitones.length-scaleCorrect} vergessen</span>}
              {perfect&&<span style={{color:'#4ade80',fontWeight:600}}>Alle Töne korrekt ✓</span>}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>{setUserSel(new Set());setShowResult(false);}} style={{background:'#f3f4f6',color:'#374151',border:'none',borderRadius:10,padding:'10px 24px',cursor:'pointer',fontWeight:600,fontSize:14}}>Nochmal</button>
              <button onClick={randomScale} style={{background:'#111827',color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',cursor:'pointer',fontWeight:600,fontSize:14,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>Neue Tonleiter 🎲</button>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:10,marginTop:28,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <SimpleDropdown value={scale.id} onChange={e=>changeScale(SCALES.find(s=>s.id===e.target.value))}>
            <optgroup label="Dur">{SCALES.filter(s=>s.type==='major').map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</optgroup>
            <optgroup label="Moll">{SCALES.filter(s=>s.type==='minor').map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</optgroup>
          </SimpleDropdown>
          <button onClick={randomScale} style={{background:'#fff',color:'#374151',border:'1.5px solid #e5e7eb',borderRadius:10,padding:'10px 20px',cursor:'pointer',fontWeight:600,fontSize:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>🎲 Zufall</button>
        </div>
      </>}

      {view==='chords' && <>
        <div style={{textAlign:'center',marginBottom:28}}>
          <h1 style={{fontSize:26,fontWeight:800,margin:0,letterSpacing:'-0.5px'}}>Akkorde</h1>
          <p style={{color:'#9ca3af',fontSize:13,margin:'4px 0 0'}}>Grün markierte Tasten gehören zum Akkord</p>
        </div>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:52,fontWeight:900,letterSpacing:'-2px',lineHeight:1}}>{chord.display}</div>
          <div style={{color:'#d1d5db',fontSize:12,marginTop:8,letterSpacing:'2px',textTransform:'uppercase',fontWeight:500}}>{chord.typeLabel}</div>
        </div>
        <div style={{background:'#fff',borderRadius:20,padding:'20px 28px 28px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',marginBottom:28,overflowX:'auto',maxWidth:'100%'}}>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}><Toggle label="Tonnamen" value={showNames} onChange={setShowNames}/></div>
          <Piano semitones={chord.semitones} mode="learn" userSel={new Set()} showResult={false} showNames={showNames} onToggle={()=>{}}/>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <SearchableChordSelect value={chord} onChange={setChord}/>
          <button onClick={randomChord} style={{background:'#fff',color:'#374151',border:'1.5px solid #e5e7eb',borderRadius:10,padding:'10px 20px',cursor:'pointer',fontWeight:600,fontSize:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>🎲 Zufall</button>
        </div>
      </>}

    </div>
  );
}
