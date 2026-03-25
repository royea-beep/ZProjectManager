// sync-project-states.js - Updates PROJECT_STATES.json from live git data
// Run: node C:\Projects\_SHARED\tools\sync-project-states.js
const {execSync}=require('child_process');
const fs=require('fs');
const path=require('path');
const STATES_FILE=path.join(__dirname,'..','PROJECT_STATES.json');
const WC2026=new Date('2026-06-12');
const PROJECTS={'9soccer':'C:/Projects/90Soccer','caps':'C:/Projects/Caps','wingman':'C:/Projects/Wingman','analyzer':'C:/Projects/analyzer-standalone','postpilot':'C:/Projects/PostPilot','keydrop':'C:/Projects/KeyDrop','explainit':'C:/Projects/ExplainIt'};
function run(cmd,cwd){try{return execSync(cmd,{cwd,encoding:'utf8',timeout:8000}).trim();}catch(e){return null;}}
function daysUntil(d){return Math.ceil((d-new Date())/(1000*60*60*24));}
const existing=fs.existsSync(STATES_FILE)?JSON.parse(fs.readFileSync(STATES_FILE,'utf8')):{projects:{}};
const out={lastUpdated:new Date().toISOString(),projects:{}};
for(const[key,pp]of Object.entries(PROJECTS)){
  const prev=existing.projects[key]||{};
  const log=run('git log -1 --format="%h|%ai"',pp);
  let hash=prev.lastCommit||'?',date=prev.lastCommitDate||'?';
  if(log){const parts=log.split('|');hash=parts[0];date=parts[1]?parts[1].slice(0,10):'?';}
  const s={score:prev.score||7.0,lastCommit:hash,lastCommitDate:date,buildStatus:prev.buildStatus||'unknown',openIssues:prev.openIssues||[],recentWork:prev.recentWork||''};
  if(key==='9soccer'){s.daysToLaunch=daysUntil(WC2026);s.launchEvent='WC2026 Jun 12';}
  out.projects[key]=s;
  console.log('OK '+key+': '+hash+' ('+date+')');
}
fs.writeFileSync(STATES_FILE,JSON.stringify(out,null,2),'utf8');
console.log('Saved: '+STATES_FILE);
