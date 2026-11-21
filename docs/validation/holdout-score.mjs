import { readFileSync } from "node:fs";
const rows = JSON.parse(readFileSync("holdout.json","utf-8")), t = JSON.parse(readFileSync("holdout-terrain.json","utf-8"));
const wilson=(k,n)=>{if(!n)return"n/a";const z=1.96,p=k/n,d=1+z*z/n,c=p+z*z/(2*n),h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return `${k}/${n} = ${Math.round(p*100)}% (${Math.round((c-h)/d*100)} to ${Math.round((c+h)/d*100)}%)`};
console.log("drawn",rows.length,"missing result/rating:",rows.filter(r=>typeof r.flooded!=="number"||!r.flood).map(r=>`${r.id}(${r.place||"no place"}: ${(r.error||"no flood rating").slice(0,35)})`).join("; ")||"none");
const all=rows.filter(r=>typeof r.flooded==="number"&&r.flood&&t[r.id]).map(r=>({...r,...t[r.id],pk:/Pakistan/.test(r.place),base:r.flood==="high"||r.flood==="medium"}));
const A=r=>r.flat>=.3&&r.max50>=800, C=r=>r.flat>=.3&&r.p99_100>=1000;
console.log("recorded live torrent vs recomputed A disagree:",all.filter(r=>(r.torrent==="medium")!==A(r)).map(r=>r.id).join(",")||"none");
for(const [name,s] of [["Pakistan (primary)",all.filter(r=>r.pk)],["All",all]]) for(const cut of [5,2,10]){
  const wet=r=>r.flooded>=cut; console.log(`\n${name}, cut ${cut}%: n=${s.length}, flooded ${s.filter(wet).length}`);
  for(const [n,f] of [["Flooding alone",r=>r.base],["Either with A (today)",r=>r.base||A(r)],["Either with C",r=>r.base||C(r)]]){const x=s.filter(f);const tp=x.filter(wet).length,fp=x.length-tp;console.log(` ${n.padEnd(22)} hit ${tp}, false ${fp} | recall ${wilson(tp,s.filter(wet).length)} | precision ${wilson(tp,x.length)}`)}
  if(cut===5){for(const [n,f] of [["A alone",A],["C alone",C]]){const x=s.filter(f);console.log(` ${n}: fires ${x.length}, flooded ${x.filter(wet).length}; ids ${x.map(r=>r.id+(wet(r)?"*":"")).join(",")}`)}
  console.log(" flooded squares missed by C+Flooding:",s.filter(r=>wet(r)&&!r.base&&!C(r)).map(r=>`${r.id} ${r.flooded}% ${r.place}`).join("; ")||"none");}
}
