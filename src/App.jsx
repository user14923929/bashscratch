import { useState, useRef, useCallback } from "react";

// ─── LOCALIZATION ─────────────────────────────────────────────────────────────
const LANGS = {
  ru: {
    appSub: "ВИЗУАЛЬНЫЙ РЕДАКТОР СКРИПТОВ",
    clear: "Очистить", copy: "Скопировать", copied: "✓ Скопировано!",
    run: "▶ Запустить", running: "⏳...", importBtn: "📂 Импорт",
    exportBtn: "💾 Экспорт .sh", templates: "📋 Шаблоны",
    scriptLabel: "СКРИПТ", blocksLabel: "блоков",
    outputLabel: "ВЫВОД", clearOutput: "Очистить",
    canvasHint: "← ДОБАВЬ БЛОКИ · ПЕРЕТАЩИ ↕ · ЗАПОЛНИ ПОЛЯ",
    canvasEmpty: "Холст пуст", canvasEmptySub: "Добавь блоки слева или загрузи шаблон",
    cats: { output:"📢 Вывод", vars:"📦 Переменные", logic:"🔀 Условия", loops:"🔁 Циклы", system:"⚙️ Система", other:"🔧 Прочее" },
    tpls: { hello:"Hello World", counter:"Счётчик", backup:"Бэкап", menu:"Меню", args:"Аргументы CLI" },
    fields: { text:"текст", name:"имя", value:"значение", cmd:"команда", cmd1:"команда1", cmd2:"команда2", file:"файл", sec:"сек", a:"левый", op:"оператор", b:"правый", var:"переменная", list:"список", cond:"условие", body:"тело" },
  },
  en: {
    appSub: "VISUAL SHELL EDITOR",
    clear: "Clear", copy: "Copy", copied: "✓ Copied!",
    run: "▶ Run", running: "⏳...", importBtn: "📂 Import",
    exportBtn: "💾 Export .sh", templates: "📋 Templates",
    scriptLabel: "SCRIPT", blocksLabel: "blocks",
    outputLabel: "OUTPUT", clearOutput: "Clear",
    canvasHint: "← ADD BLOCKS · DRAG ↕ · FILL FIELDS",
    canvasEmpty: "Canvas empty", canvasEmptySub: "Add blocks from the left or load a template",
    cats: { output:"📢 Output", vars:"📦 Variables", logic:"🔀 Conditions", loops:"🔁 Loops", system:"⚙️ System", other:"🔧 Other" },
    tpls: { hello:"Hello World", counter:"Counter", backup:"Backup", menu:"Menu", args:"CLI Args" },
    fields: { text:"text", name:"name", value:"value", cmd:"command", cmd1:"command1", cmd2:"command2", file:"file", sec:"sec", a:"left", op:"operator", b:"right", var:"variable", list:"list", cond:"condition", body:"body" },
  },
  uk: {
    appSub: "ВІЗУАЛЬНИЙ РЕДАКТОР СКРИПТІВ",
    clear: "Очистити", copy: "Копіювати", copied: "✓ Скопійовано!",
    run: "▶ Запустити", running: "⏳...", importBtn: "📂 Імпорт",
    exportBtn: "💾 Експорт .sh", templates: "📋 Шаблони",
    scriptLabel: "СКРИПТ", blocksLabel: "блоків",
    outputLabel: "ВИВІД", clearOutput: "Очистити",
    canvasHint: "← ДОДАЙ БЛОКИ · ПЕРЕТЯГНИ ↕ · ЗАПОВНИ ПОЛЯ",
    canvasEmpty: "Полотно порожнє", canvasEmptySub: "Додай блоки зліва або завантаж шаблон",
    cats: { output:"📢 Вивід", vars:"📦 Змінні", logic:"🔀 Умови", loops:"🔁 Цикли", system:"⚙️ Система", other:"🔧 Інше" },
    tpls: { hello:"Hello World", counter:"Лічильник", backup:"Бекап", menu:"Меню", args:"Аргументи CLI" },
    fields: { text:"текст", name:"ім'я", value:"значення", cmd:"команда", cmd1:"команда1", cmd2:"команда2", file:"файл", sec:"сек", a:"лівий", op:"оператор", b:"правий", var:"змінна", list:"список", cond:"умова", body:"тіло" },
  },
};

// ─── BLOCK DEFINITIONS ───────────────────────────────────────────────────────
const BD = {
  shebang:  { label:"#!/bin/bash", color:"#334155", cat:"other",  tpl:"#!/bin/bash",                    fields:[], opens:false, closes:false, indent:0 },
  comment:  { label:"# коммент",  color:"#475569", cat:"other",  tpl:"# {text}",                       fields:[{key:"text",ph:"комментарий"}], opens:false, closes:false, indent:0 },
  function: { label:"function",   color:"#d946ef", cat:"other",  tpl:"{name}() {",                     fields:[{key:"name",ph:"my_func"}], opens:true, closes:false, indent:0 },
  funcend:  { label:"} end",      color:"#d946ef", cat:"other",  tpl:"}",                              fields:[], opens:false, closes:true, indent:-1 },
  echo:     { label:"echo",       color:"#00d4aa", cat:"output", tpl:'echo "{text}"',                  fields:[{key:"text",ph:"Hello World"}], opens:false, closes:false, indent:0 },
  printf:   { label:"printf",     color:"#00b894", cat:"output", tpl:"printf '%s\\n' \"{text}\"",      fields:[{key:"text",ph:"text here"}], opens:false, closes:false, indent:0 },
  var:      { label:"var=",       color:"#f59e0b", cat:"vars",   tpl:'{name}="{value}"',               fields:[{key:"name",ph:"myvar"},{key:"value",ph:"123"}], opens:false, closes:false, indent:0 },
  read:     { label:"read",       color:"#f59e0b", cat:"vars",   tpl:"read {name}",                   fields:[{key:"name",ph:"input"}], opens:false, closes:false, indent:0 },
  export:   { label:"export",     color:"#fbbf24", cat:"vars",   tpl:"export {name}={value}",          fields:[{key:"name",ph:"PATH"},{key:"value",ph:"/usr/bin"}], opens:false, closes:false, indent:0 },
  if:       { label:"if [  ]",    color:"#8b5cf6", cat:"logic",  tpl:'if [ "{a}" {op} "{b}" ]; then', fields:[{key:"a",ph:"val1"},{key:"op",ph:"-eq",opts:["-eq","-ne","-lt","-gt","-le","-ge","=","!=","-z","-n"]},{key:"b",ph:"val2"}], opens:true, closes:false, indent:0 },
  elif:     { label:"elif [  ]",  color:"#7c3aed", cat:"logic",  tpl:'elif [ "{a}" {op} "{b}" ]; then',fields:[{key:"a",ph:"val1"},{key:"op",ph:"-eq",opts:["-eq","-ne","-lt","-gt","=","!="]},{key:"b",ph:"val2"}], opens:true, closes:false, indent:-1 },
  else:     { label:"else",       color:"#a78bfa", cat:"logic",  tpl:"else",                          fields:[], opens:true, closes:false, indent:-1 },
  fi:       { label:"fi",         color:"#8b5cf6", cat:"logic",  tpl:"fi",                            fields:[], opens:false, closes:true, indent:-1 },
  for:      { label:"for … in",   color:"#ec4899", cat:"loops",  tpl:"for {var} in {list}; do",       fields:[{key:"var",ph:"i"},{key:"list",ph:"1 2 3 4 5"}], opens:true, closes:false, indent:0 },
  while:    { label:"while",      color:"#db2777", cat:"loops",  tpl:"while {cond}; do",              fields:[{key:"cond",ph:"true"}], opens:true, closes:false, indent:0 },
  break:    { label:"break",      color:"#f472b6", cat:"loops",  tpl:"break",                         fields:[], opens:false, closes:false, indent:0 },
  continue: { label:"continue",   color:"#f472b6", cat:"loops",  tpl:"continue",                      fields:[], opens:false, closes:false, indent:0 },
  done:     { label:"done",       color:"#ec4899", cat:"loops",  tpl:"done",                          fields:[], opens:false, closes:true, indent:-1 },
  cmd:      { label:"$ cmd",      color:"#06b6d4", cat:"system", tpl:"{cmd}",                         fields:[{key:"cmd",ph:"ls -la"}], opens:false, closes:false, indent:0 },
  pipe:     { label:"cmd | cmd",  color:"#0ea5e9", cat:"system", tpl:"{cmd1} | {cmd2}",               fields:[{key:"cmd1",ph:"cat file.txt"},{key:"cmd2",ph:"grep error"}], opens:false, closes:false, indent:0 },
  redirect: { label:"cmd > file", color:"#38bdf8", cat:"system", tpl:"{cmd} > {file}",                fields:[{key:"cmd",ph:"echo hi"},{key:"file",ph:"out.txt"}], opens:false, closes:false, indent:0 },
  append:   { label:"cmd >> file",color:"#38bdf8", cat:"system", tpl:"{cmd} >> {file}",               fields:[{key:"cmd",ph:"echo hi"},{key:"file",ph:"log.txt"}], opens:false, closes:false, indent:0 },
  sleep:    { label:"sleep",      color:"#64748b", cat:"system", tpl:"sleep {sec}",                   fields:[{key:"sec",ph:"1"}], opens:false, closes:false, indent:0 },
  exit:     { label:"exit",       color:"#ef4444", cat:"system", tpl:"exit {value}",                  fields:[{key:"value",ph:"0"}], opens:false, closes:false, indent:0 },
};

const CATS = { output:"#00d4aa", vars:"#f59e0b", logic:"#8b5cf6", loops:"#ec4899", system:"#06b6d4", other:"#64748b" };

// ─── TEMPLATES ────────────────────────────────────────────────────────────────
const TEMPLATES = {
  hello:   [{type:"shebang",v:{}},{type:"echo",v:{text:"Hello, World!"}}],
  counter: [{type:"shebang",v:{}},{type:"var",v:{name:"i",value:"1"}},{type:"while",v:{cond:"$i -le 5"}},{type:"echo",v:{text:"Iteration: $i"}},{type:"var",v:{name:"i",value:"$((i+1))"}},{type:"done",v:{}}],
  backup:  [{type:"shebang",v:{}},{type:"var",v:{name:"SRC",value:"/home/user/docs"}},{type:"var",v:{name:"DST",value:"/backup/docs_$(date +%F)"}},{type:"cmd",v:{cmd:"mkdir -p $DST"}},{type:"cmd",v:{cmd:"cp -r $SRC $DST"}},{type:"echo",v:{text:"Done! Backup: $DST"}}],
  menu:    [{type:"shebang",v:{}},{type:"echo",v:{text:"1) Files  2) Date  3) Exit"}},{type:"read",v:{name:"choice"}},{type:"if",v:{a:"$choice",op:"=",b:"1"}},{type:"cmd",v:{cmd:"ls -la"}},{type:"elif",v:{a:"$choice",op:"=",b:"2"}},{type:"cmd",v:{cmd:"date"}},{type:"else",v:{}},{type:"exit",v:{value:"0"}},{type:"fi",v:{}}],
  args:    [{type:"shebang",v:{}},{type:"comment",v:{text:"Usage: ./script.sh John 25"}},{type:"var",v:{name:"NAME",value:"$1"}},{type:"var",v:{name:"AGE",value:"$2"}},{type:"echo",v:{text:"Hi $NAME! You are $AGE years old."}}],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
let uid = 1;
function mk(type, vals={}) {
  const def = BD[type]; if (!def) return null;
  const v={};
  def.fields.forEach(f => { v[f.key] = vals[f.key]!==undefined ? vals[f.key] : ""; });
  return { id: uid++, type, values: v };
}

function renderLine(block) {
  const def = BD[block.type];
  let t = def.tpl;
  def.fields.forEach(f => { t = t.replaceAll(`{${f.key}}`, block.values[f.key] || f.ph || ""); });
  return t;
}

function generateScript(blocks) {
  if (!blocks.length) return "";
  let depth = 0;
  return blocks.map(b => {
    const def = BD[b.type];
    if (def.indent === -1) depth = Math.max(0,depth-1);
    const line = "  ".repeat(depth) + renderLine(b);
    if (def.opens) depth++;
    if (def.closes && def.indent !== -1) depth = Math.max(0,depth-1);
    return line;
  }).join("\n");
}

function syntaxColor(line) {
  const t = line.trimStart();
  if (t.startsWith("#!")) return "#475569";
  if (t.startsWith("#"))  return "#475569";
  if (/^(echo|printf)/.test(t)) return "#00d4aa";
  if (/^(if|elif|else|fi)\b/.test(t)) return "#a78bfa";
  if (/^(for|while|done|break|continue)\b/.test(t)) return "#f472b6";
  if (/^\w+\s*\(\)\s*\{/.test(t) || t === "}") return "#d946ef";
  if (/^(export\s+)?\w+=/.test(t)) return "#f59e0b";
  if (/^read\b/.test(t)) return "#fbbf24";
  if (/^exit\b/.test(t)) return "#ef4444";
  if (t.includes("|") || t.includes(">")) return "#38bdf8";
  if (/^sleep\b/.test(t)) return "#64748b";
  return "#94a3b8";
}

// ─── FAKE RUNNER ─────────────────────────────────────────────────────────────
function fakeRun(script) {
  const lines = script.split("\n");
  const out = []; const vars = {}; let steps=0;
  const ev = s => s.replace(/\$\{?(\w+)\}?/g, (_,k) => vars[k]??k);
  for (let i=0; i<lines.length && steps++<150; i++) {
    const r = lines[i].trim();
    if (!r || r.startsWith("#")) continue;
    if (r.startsWith("#!/")) continue;
    const em = r.match(/^(?:echo|printf\s+'%s\\n')\s+"?(.+?)"?$/);
    if (em) { out.push(ev(em[1])); continue; }
    const vm = r.match(/^(\w+)=(.*)$/);
    if (vm) {
      let v = vm[2].replace(/^["']|["']$/g,"");
      v = ev(v).replace(/\$\(\((.+?)\)\)/g,(_,e)=>{try{return String(eval(e.replace(/\$?\b(\w+)\b/g,(_,k)=>vars[k]??k)))}catch{return"?"}});
      vars[vm[1]]=v; continue;
    }
    if (r.startsWith("sleep")) { out.push(`[sleep ${r.split(" ")[1]||"1"}s]`); continue; }
    if (r.startsWith("exit")) { out.push(`[exit ${r.split(" ")[1]||"0"}]`); break; }
    if (r==="date") { out.push(new Date().toString()); continue; }
    if (r==="whoami") { out.push("user"); continue; }
    if (r==="pwd") { out.push("/home/user"); continue; }
    if (r.startsWith("ls")) { out.push("Documents  Downloads  Desktop  Music  Videos"); continue; }
    if (r.startsWith("mkdir")||r.startsWith("cp ")||r.startsWith("cat ")) { out.push(`[${r}]`); continue; }
    if (r.includes("|")||r.includes(">")) { out.push(`[${ev(r)}]`); continue; }
    if (/^(if|elif|else|fi|for|while|done|break|continue|\}|\w+\(\)\{)/.test(r)) continue;
    out.push(`$ ${ev(r)}`);
  }
  if (steps>=150) out.push("... [вывод обрезан]");
  return out.length ? out.join("\n") : "[нет вывода]";
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const inp = {
  background:"#070e1c", border:"1px solid #0f172a", color:"#e2e8f0",
  borderRadius:5, padding:"3px 7px", fontSize:11,
  fontFamily:"'JetBrains Mono','Fira Mono',monospace",
  outline:"none", flex:1, minWidth:55,
};

function Btn({label, color, bg, onClick, disabled, full}) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        background: h&&!disabled ? bg+"cc" : bg,
        border:`1px solid ${color}30`, color, borderRadius:6,
        padding:"5px 11px", cursor:disabled?"not-allowed":"pointer",
        fontFamily:"'JetBrains Mono',monospace", fontSize:10,
        fontWeight:700, letterSpacing:0.5, display:"inline-flex",
        alignItems:"center", gap:4, whiteSpace:"nowrap",
        width: full?"100%":undefined, justifyContent:full?"center":undefined,
        opacity:disabled?0.5:1, transition:"background 0.12s",
      }}>{label}</button>
  );
}

function BlockWidget({block, idx, total, onRemove, onChange, onMove, t, dragProps, isDragging, isOver}) {
  const def = BD[block.type];
  return (
    <div {...dragProps} style={{
      display:"flex", alignItems:"flex-start", gap:6,
      marginBottom:5, borderRadius:10, padding:"8px 9px",
      background: isOver?"#0d1a2e" : isDragging?"#050c18" : "#06101e",
      borderLeft:`3px solid ${def.color}`,
      outline: isOver ? `1px dashed ${def.color}60` : "none",
      opacity:isDragging?0.35:1, cursor:"grab",
      transition:"opacity 0.12s, background 0.1s",
      userSelect:"none",
    }}>
      <div style={{color:"#1a2a40",fontSize:16,paddingTop:2,cursor:"grab"}}>⠿</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:def.color, fontWeight:800, fontSize:9, marginBottom:4, letterSpacing:1.2}}>
          {def.label.toUpperCase()}
        </div>
        {def.fields.length===0 && <span style={{color:"#1e3050",fontSize:12}}>{def.tpl}</span>}
        {def.fields.map(f=>(
          <div key={f.key} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            <span style={{color:"#1e3050",fontSize:9,minWidth:28,textAlign:"right"}}>{t.fields[f.key]||f.key}</span>
            {f.opts ? (
              <select value={block.values[f.key]||""} onChange={e=>onChange(f.key,e.target.value)}
                style={{...inp,cursor:"pointer"}}>
                {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input value={block.values[f.key]||""} onChange={e=>onChange(f.key,e.target.value)}
                placeholder={f.ph} style={inp} spellCheck={false} />
            )}
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <button onClick={()=>onMove(-1)} disabled={idx===0} style={arB(idx===0)}>▲</button>
        <button onClick={()=>onMove(1)}  disabled={idx===total-1} style={arB(idx===total-1)}>▼</button>
        <button onClick={onRemove} style={{...arB(false),color:"#ef4444",marginTop:4}}>✕</button>
      </div>
    </div>
  );
}
const arB = d => ({
  background:"none", border:`1px solid ${d?"#0f172a":"#1e293b"}`,
  color:d?"#0f172a":"#475569", borderRadius:4,
  cursor:d?"not-allowed":"pointer", padding:"2px 5px",
  fontSize:8, fontFamily:"inherit", lineHeight:1,
});

function PaletteBtn({ type, def, onAdd }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => onAdd(type)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width:"100%", marginBottom:3,
        background: h ? `${def.color}18` : "#040d1e",
        border: `1px solid ${h ? def.color+"60" : "#071020"}`,
        borderRadius:7, color:def.color, padding:"7px 8px", cursor:"pointer",
        fontFamily:"inherit", fontSize:11, textAlign:"left",
        fontWeight:700, display:"flex", alignItems:"center", gap:5,
        transition:"all 0.1s",
      }}>
      <span style={{opacity:0.4}}>+</span>{def.label}
    </button>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("ru");
  const t = LANGS[lang];
  const [blocks, setBlocks] = useState([mk("shebang"), mk("echo",{text:"Hello, World!"})]);
  const [activeCat, setActiveCat] = useState("output");
  const [copied, setCopied] = useState(false);
  const [showTpl, setShowTpl] = useState(false);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const fileRef = useRef();

  const script = generateScript(blocks);

  const addBlock = useCallback(type => setBlocks(p=>[...p, mk(type)]), []);
  const removeBlock = useCallback(id => setBlocks(p=>p.filter(b=>b.id!==id)), []);
  const changeBlock = useCallback((id,key,val) => setBlocks(p=>p.map(b=>b.id===id?{...b,values:{...b.values,[key]:val}}:b)), []);
  const moveBlock = useCallback((idx,dir) => setBlocks(p=>{
    const a=[...p], ni=idx+dir;
    if(ni<0||ni>=a.length) return p;
    [a[idx],a[ni]]=[a[ni],a[idx]]; return a;
  }), []);

  const dStart = idx => setDragIdx(idx);
  const dOver  = (e,idx) => { e.preventDefault(); setOverIdx(idx); };
  const dDrop  = (e,idx) => {
    e.preventDefault();
    if (dragIdx!==null && dragIdx!==idx) {
      setBlocks(p=>{
        const a=[...p],[item]=a.splice(dragIdx,1);
        a.splice(idx,0,item); return a;
      });
    }
    setDragIdx(null); setOverIdx(null);
  };
  const dEnd   = () => { setDragIdx(null); setOverIdx(null); };

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopied(true); setTimeout(()=>setCopied(false),1800);
  };
  const runScript = () => {
    setRunning(true); setOutput("");
    setTimeout(()=>{ setOutput(fakeRun(script)); setRunning(false); }, 500);
  };
  const exportScript = () => {
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([script],{type:"text/plain"}));
    a.download="script.sh"; a.click();
  };
  const importScript = e => {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=ev=>{
      const lines=ev.target.result.split("\n");
      const nb=[];
      lines.forEach(raw=>{
        const l=raw.trim(); if(!l) return;
        if(l.startsWith("#!/"))  { nb.push(mk("shebang")); return; }
        if(l.startsWith("# "))   { nb.push(mk("comment",{text:l.slice(2)})); return; }
        if(l.startsWith("echo "))  { nb.push(mk("echo",{text:l.slice(5).replace(/^["']|["']$/g,"")})); return; }
        if(l.startsWith("read "))  { nb.push(mk("read",{name:l.slice(5)})); return; }
        if(l.startsWith("sleep ")) { nb.push(mk("sleep",{sec:l.split(" ")[1]||"1"})); return; }
        if(l.startsWith("exit"))   { nb.push(mk("exit",{value:l.split(" ")[1]||"0"})); return; }
        if(l==="else") { nb.push(mk("else")); return; }
        if(l==="fi")   { nb.push(mk("fi")); return; }
        if(l==="done") { nb.push(mk("done")); return; }
        if(l==="}")    { nb.push(mk("funcend")); return; }
        if(l.startsWith("for ")&&l.includes(" in ")){const m=l.match(/for (\w+) in (.+?);/);if(m){nb.push(mk("for",{var:m[1],list:m[2]}));return;}}
        if(l.startsWith("while ")){const m=l.match(/while (.+?);/);if(m){nb.push(mk("while",{cond:m[1]}));return;}}
        if(l.startsWith("if [")){const m=l.match(/if \[ "?(.+?)"? (.+?) "?(.+?)"? \]/);if(m){nb.push(mk("if",{a:m[1],op:m[2],b:m[3]}));return;}}
        const em=l.match(/^export\s+(\w+)=(.*)$/);if(em){nb.push(mk("export",{name:em[1],value:em[2].replace(/^["']|["']$/g,"")}));return;}
        const vm=l.match(/^(\w+)=(.*)$/);if(vm){nb.push(mk("var",{name:vm[1],value:vm[2].replace(/^["']|["']$/g,"")}));return;}
        if(l.includes(" | ")){const[c1,c2]=l.split(" | ");nb.push(mk("pipe",{cmd1:c1.trim(),cmd2:c2.trim()}));return;}
        if(l.includes(" >> ")){const[c,f]=l.split(" >> ");nb.push(mk("append",{cmd:c.trim(),file:f.trim()}));return;}
        if(l.includes(" > ")){const[c,f]=l.split(" > ");nb.push(mk("redirect",{cmd:c.trim(),file:f.trim()}));return;}
        nb.push(mk("cmd",{cmd:l}));
      });
      setBlocks(nb.length?nb:[mk("shebang")]);
    };
    r.readAsText(file); e.target.value="";
  };
  const loadTpl = key => {
    const tpl=TEMPLATES[key]; if(!tpl) return;
    setBlocks(tpl.map(({type,v})=>mk(type,v)));
    setShowTpl(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#020817",fontFamily:"'JetBrains Mono','Fira Mono',monospace",display:"flex",flexDirection:"column",overflow:"hidden",color:"#e2e8f0"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#030c1f,#061428)",borderBottom:"1px solid #0a1628",padding:"9px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:20}}>🐚</span>
        <div>
          <div style={{color:"#00d4aa",fontWeight:900,fontSize:14,letterSpacing:3}}>BASH SCRATCH</div>
          <div style={{color:"#0f2040",fontSize:8,letterSpacing:2}}>{t.appSub}</div>
        </div>
        {/* lang */}
        <div style={{display:"flex",gap:3,marginLeft:6}}>
          {["ru","en","uk"].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{
              background:lang===l?"#061428":"transparent",
              border:`1px solid ${lang===l?"#00d4aa40":"#0a1628"}`,
              color:lang===l?"#00d4aa":"#1e3a5f",
              borderRadius:5,padding:"3px 8px",cursor:"pointer",
              fontFamily:"inherit",fontSize:9,fontWeight:700,letterSpacing:1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <Btn label={t.templates}  color="#f59e0b" bg="#1c0a00" onClick={()=>setShowTpl(p=>!p)} />
          <input ref={fileRef} type="file" accept=".sh,.txt" style={{display:"none"}} onChange={importScript}/>
          <Btn label={t.importBtn}  color="#38bdf8" bg="#0c2340" onClick={()=>fileRef.current.click()} />
          <Btn label={t.exportBtn}  color="#06b6d4" bg="#083344" onClick={exportScript} />
          <Btn label={t.clear}      color="#ef4444" bg="#2d0a0a" onClick={()=>setBlocks([])} />
          <Btn label={copied?t.copied:t.copy} color="#00d4aa" bg="#022c22" onClick={copyScript} />
          <Btn label={running?t.running:t.run} color="#10b981" bg="#052e16" onClick={runScript} disabled={running} />
        </div>
      </div>

      {/* TEMPLATES BAR */}
      {showTpl && (
        <div style={{background:"#030c1f",borderBottom:"1px solid #0a1628",padding:"8px 14px",display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.keys(TEMPLATES).map(k=>(
            <Btn key={k} label={t.tpls[k]||k} color="#f59e0b" bg="#1c0a00" onClick={()=>loadTpl(k)} />
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

        {/* LEFT PALETTE */}
        <div style={{width:185,background:"#020c1c",borderRight:"1px solid #071020",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"7px 5px 3px",display:"flex",flexDirection:"column",gap:1}}>
            {Object.entries(CATS).map(([cat,color])=>(
              <button key={cat} onClick={()=>setActiveCat(cat)} style={{
                background:activeCat===cat?"#061428":"transparent",
                border:`1px solid ${activeCat===cat?color+"30":"transparent"}`,
                color:activeCat===cat?color:"#1e3a5f",
                borderRadius:6,padding:"5px 8px",cursor:"pointer",
                fontFamily:"inherit",fontSize:10,textAlign:"left",fontWeight:700,letterSpacing:0.3,
              }}>{t.cats[cat]}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"2px 5px 8px"}}>
            {Object.entries(BD).filter(([,d])=>d.cat===activeCat).map(([type,def])=>(
              <PaletteBtn key={type} type={type} def={def} onAdd={addBlock} />
            ))}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",background:"#020817",minWidth:0}}>
          <div style={{color:"#0a1828",fontSize:9,marginBottom:8,letterSpacing:1}}>{t.canvasHint}</div>
          {blocks.length===0 && (
            <div style={{textAlign:"center",color:"#0a1828",marginTop:60,lineHeight:2.5}}>
              <div style={{fontSize:40}}>🐚</div>
              <div style={{fontSize:13}}>{t.canvasEmpty}</div>
              <div style={{fontSize:10}}>{t.canvasEmptySub}</div>
            </div>
          )}
          {blocks.map((block,idx)=>(
            <BlockWidget key={block.id} block={block} idx={idx} total={blocks.length}
              t={t}
              onRemove={()=>removeBlock(block.id)}
              onChange={(key,val)=>changeBlock(block.id,key,val)}
              onMove={dir=>moveBlock(idx,dir)}
              isDragging={dragIdx===idx}
              isOver={overIdx===idx}
              dragProps={{
                draggable:true,
                onDragStart:()=>dStart(idx),
                onDragOver:e=>dOver(e,idx),
                onDrop:e=>dDrop(e,idx),
                onDragEnd:dEnd,
              }}
            />
          ))}
          {/* drop zone tail */}
          <div onDragOver={e=>{e.preventDefault();setOverIdx(blocks.length);}}
               onDrop={e=>dDrop(e,blocks.length)}
               style={{height:28,borderRadius:8,border:overIdx===blocks.length?"1px dashed #00d4aa40":"1px dashed transparent",transition:"border 0.1s"}} />
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:265,background:"#020c1c",borderLeft:"1px solid #071020",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Script preview */}
          <div style={{flex:"0 0 55%",display:"flex",flexDirection:"column",borderBottom:"1px solid #071020",minHeight:0}}>
            <div style={{padding:"7px 11px",borderBottom:"1px solid #071020",color:"#00d4aa",fontSize:9,letterSpacing:2,fontWeight:700,display:"flex",alignItems:"center"}}>
              📄 {t.scriptLabel}
              <span style={{marginLeft:"auto",color:"#0f2040",fontSize:8}}>{blocks.length} {t.blocksLabel}</span>
            </div>
            <pre style={{flex:1,overflowY:"auto",margin:0,padding:"8px 11px",color:"#475569",fontSize:10.5,lineHeight:1.9,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
              {(script||"# "+t.canvasEmpty).split("\n").map((line,i)=>(
                <span key={i} style={{color:syntaxColor(line),display:"block"}}>
                  <span style={{color:"#0a1828",userSelect:"none",marginRight:6,fontSize:8}}>{String(i+1).padStart(2)}</span>
                  {line||" "}
                </span>
              ))}
            </pre>
            <div style={{padding:"5px 8px",borderTop:"1px solid #071020"}}>
              <Btn label={copied?t.copied:t.copy} color="#00d4aa" bg="#022c22" onClick={copyScript} full />
            </div>
          </div>

          {/* Output */}
          <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{padding:"7px 11px",borderBottom:"1px solid #071020",color:"#10b981",fontSize:9,letterSpacing:2,fontWeight:700,display:"flex",alignItems:"center"}}>
              ▶ {t.outputLabel}
              {output && <button onClick={()=>setOutput("")} style={{marginLeft:"auto",background:"none",border:"none",color:"#0f2040",cursor:"pointer",fontSize:8,fontFamily:"inherit"}}>{t.clearOutput}</button>}
            </div>
            <pre style={{flex:1,overflowY:"auto",margin:0,padding:"8px 11px",color:output?"#6ee7b7":"#0a1828",fontSize:10.5,lineHeight:1.9,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
              {output||(running?"...":"$ _")}
            </pre>
            <div style={{padding:"5px 8px",borderTop:"1px solid #071020"}}>
              <Btn label={running?t.running:t.run} color="#10b981" bg="#052e16" onClick={runScript} disabled={running} full />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}