(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const today = () => new Date().toISOString().slice(0,10);
  const uid = () => Math.random().toString(36).slice(2,10);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sampleSpaces = [
    {id:'library',name:'Central Library',type:'Quiet zone',quiet:true,group:false,distance:2,seats:18,total:40,available:true,description:'A calm space for deep focus and individual revision.'},
    {id:'commons',name:'Learning Commons',type:'Group study',quiet:false,group:true,distance:4,seats:7,total:24,available:true,description:'Collaborative tables for project work and discussion.'},
    {id:'block-a',name:'Block A Study Lounge',type:'Mixed seating',quiet:false,group:true,distance:1,seats:3,total:16,available:false,description:'Casual seating close to classrooms.'},
    {id:'reading-room',name:'Reading Room 2',type:'Quiet zone',quiet:true,group:false,distance:3,seats:12,total:20,available:true,description:'A quieter alternative for longer study sessions.'}
  ];
  let profile = localStorage.getItem('studyspot-profile') || 'DEMO-STUDENT';
  let db = loadDb(profile);
  let activeCheckin = null;
  function loadDb(id) {
    try {
      const saved = JSON.parse(localStorage.getItem('studyspot-data-'+id));
      return saved || {exams:[],minutes:0,sessionDates:[],dailyMinutes:{},reservations:[],assessments:[]};
    } catch { return {exams:[],minutes:0,sessionDates:[],dailyMinutes:{},reservations:[],assessments:[]}; }
  }
  function save() { localStorage.setItem('studyspot-data-'+profile, JSON.stringify(db)); renderAll(); }
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2400); }
  function daysUntil(date) { return Math.ceil((new Date(date+'T00:00:00')-new Date(today()+'T00:00:00'))/86400000); }
  function allTopics() { return db.exams.flatMap(e=>e.topics.map(t=>({...t,examId:e.id,subject:e.subject,examDate:e.date,days:daysUntil(e.date)}))); }
  function priorityScore(t) { return (100-t.mastery)*0.55 + t.weight*5 + Math.max(0,14-t.days)*2 + (t.missed||0)*6; }
  function orderedTopics() { return allTopics().sort((a,b)=>priorityScore(b)-priorityScore(a)); }
  function renderAll() { $('#student-label').textContent=profile; renderOverview();renderExams();renderPractice();renderSpaces();renderProgress(); }
  function renderOverview() {
    const topics=allTopics(), mastered=topics.filter(t=>t.mastery>=80).length, exams=db.exams.filter(e=>daysUntil(e.date)>=0).length;
    $('#stat-minutes').textContent=db.minutes+' min';$('#stat-mastered').textContent=mastered;$('#stat-exams').textContent=exams;
    $('#hero-streak').textContent=streak()+' days';
    const next=[...db.exams].filter(e=>daysUntil(e.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))[0];
    $('#next-exam').innerHTML=next?`<div class="exam-highlight"><div><h4>${escapeHtml(next.subject)}</h4><span class="muted">${escapeHtml(next.date)} · ${next.topics.length} topics</span></div><div class="countdown">${daysUntil(next.date)}<small style="display:block;font:500 10px 'DM Sans';text-align:center">days left</small></div></div>`:'No exams yet. Add one in your planner to get started.';
    const top=orderedTopics().slice(0,4);
    $('#priority-list').innerHTML=top.length?top.map(t=>`<div class="topic-row"><div class="topic-row-head"><div><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.subject)} · ${t.days<0?'Exam passed':t.days+' days to exam'}</small></div><b>${t.mastery}%</b></div><div class="progress-track"><span style="width:${t.mastery}%"></span></div></div>`).join(''):'<p class="muted">Add topics to see your priorities.</p>';
  }
  function renderExams() {
    $('#exam-list').innerHTML=db.exams.length?db.exams.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<article class="exam-item"><div><h3>${escapeHtml(e.subject)}</h3><p>${escapeHtml(e.date)} · ${Math.max(0,daysUntil(e.date))} days remaining</p><div>${e.topics.map(t=>`<span class="topic-chip">${escapeHtml(t.name)} · ${t.mastery}%</span>`).join('')}</div></div><button class="small-btn" data-delete-exam="${e.id}">Remove</button></article>`).join(''):'<div class="empty-state">Your exam plan is empty. Add your first exam above.</div>';
    const start=$('#timetable-date'); if(!start.value)start.value=today();
  }
  function renderPractice() {
    const topics=allTopics(), select=$('#practice-topic'), previous=select.value;
    select.innerHTML=topics.length?topics.map(t=>`<option value="${t.examId}|${t.id}">${escapeHtml(t.subject)} — ${escapeHtml(t.name)}</option>`).join(''):'<option value="">Add an exam topic first</option>';
    if(topics.some(t=>t.examId+'|'+t.id===previous))select.value=previous;
    $('#mastery-list').innerHTML=topics.length?topics.map(t=>`<div class="topic-row"><div class="topic-row-head"><div><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.subject)}</small></div><b>${t.mastery}%</b></div><div class="progress-track"><span style="width:${t.mastery}%"></span></div></div>`).join(''):'<p class="muted">Your topics will appear here.</p>';
  }
  function renderSpaces() {
    const query=$('#space-search').value.toLowerCase(), filter=$('#space-filter').value;
    let spaces=sampleSpaces.filter(s=>(s.name+' '+s.type+' '+s.description).toLowerCase().includes(query));
    if(filter==='quiet')spaces=spaces.filter(s=>s.quiet);if(filter==='group')spaces=spaces.filter(s=>s.group);if(filter==='available')spaces=spaces.filter(s=>s.available&&s.seats>0);
    if(filter==='nearest')spaces.sort((a,b)=>a.distance-b.distance);if(filter==='least')spaces.sort((a,b)=>(a.total-a.seats)-(b.total-b.seats));
    $('#space-list').innerHTML=spaces.map(s=>`<article class="space-card"><div class="panel-head"><div><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p></div><span class="pill">${s.available&&s.seats?'AVAILABLE':'BUSY'}</span></div><div class="space-meta"><span>${escapeHtml(s.type)}</span><span>${s.distance} min walk</span><span>${s.seats} / ${s.total} seats est.</span></div><button class="primary" data-checkin="${s.id}">Check in</button></article>`).join('')||'<div class="empty-state">No spaces match these filters.</div>';
  }
  function streak() { const dates=[...new Set(db.sessionDates)].sort().reverse();if(!dates.length)return 0;let count=0, d=new Date(today()+'T00:00:00');if(dates[0]!==today())d.setDate(d.getDate()-1);while(dates.includes(d.toISOString().slice(0,10))){count++;d.setDate(d.getDate()-1)}return count; }
  function renderProgress() {
    $('#progress-minutes').textContent=db.minutes+' min';$('#progress-streak').textContent=streak()+' days';$('#coverage').textContent=(allTopics().length?Math.round(allTopics().reduce((s,t)=>s+t.mastery,0)/allTopics().length):0)+'%';
    const labels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], now=new Date(), vals=[];
    for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const key=d.toISOString().slice(0,10);vals.push({label:labels[d.getDay()],minutes:db.dailyMinutes[key]||0});}
    const max=Math.max(25,...vals.map(v=>v.minutes));
    $('#weekly-chart').innerHTML=vals.map(v=>`<div class="day-bar"><b>${v.minutes}</b><div class="bar-rail"><div class="bar-fill" style="height:${Math.max(2,v.minutes/max*90)}px"></div></div><small>${v.label}</small></div>`).join('');
    $('#student-id').value=profile;
  }
  function switchView(name) { $$('.view').forEach(v=>v.classList.toggle('active',v.id===name));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));window.scrollTo({top:0,behavior:'smooth'}); }
  $$('.tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.goto)));
  $('#exam-form').addEventListener('submit',e=>{e.preventDefault();const subject=$('#exam-subject').value.trim(),date=$('#exam-date').value, names=$('#exam-topics').value.split(',').map(x=>x.trim()).filter(Boolean);if(date<today()){toast('Choose today or a future exam date.');return;}db.exams.push({id:uid(),subject,date,topics:(names.length?names:['Review '+subject]).map(name=>({id:uid(),name,mastery:0,weight:3,missed:0}))});e.target.reset();save();toast('Exam added to your planner.');});
  $('#exam-list').addEventListener('click',e=>{const id=e.target.dataset.deleteExam;if(!id)return;db.exams=db.exams.filter(x=>x.id!==id);save();toast('Exam removed.');});
  $('#practice-form').addEventListener('submit',e=>{e.preventDefault();const [examId,topicId]=$('#practice-topic').value.split('|'), score=Number($('#practice-score').value);const exam=db.exams.find(x=>x.id===examId),topic=exam?.topics.find(x=>x.id===topicId);if(!topic){toast('Add a topic first.');return;}topic.mastery=score;db.assessments.push({topic:topic.name,score,date:today()});save();$('#practice-result').innerHTML=`<p class="success">Assessment saved — ${escapeHtml(topic.name)} is now at ${score}% mastery.</p>`;toast('Preparedness score updated.');});
  $('#log-session').addEventListener('click',()=>{const key=today();db.minutes+=25;db.dailyMinutes[key]=(db.dailyMinutes[key]||0)+25;if(!db.sessionDates.includes(key))db.sessionDates.push(key);save();toast('25 minutes added to your progress.');});
  $('#timetable-form').addEventListener('submit',e=>{e.preventDefault();const mins=Math.max(15,Number($('#available-minutes').value)||120),start=$('#timetable-date').value;const topics=orderedTopics();if(!topics.length){$('#timetable-output').innerHTML='<p class="muted">Add an exam and topics before generating your timetable.</p>';return;}let date=new Date(start+'T00:00:00');const per=Math.max(1,Math.floor(mins/30));let html='<div class="stack" style="margin-top:16px">';topics.slice(0,Math.min(12,per*4)).forEach((t,i)=>{const dayOffset=i===0?0:i<per?1:i<per*2?4:7;const d=new Date(date);d.setDate(d.getDate()+dayOffset);html+=`<div class="topic-row"><div class="topic-row-head"><div><strong>Day ${dayOffset+1}: ${escapeHtml(t.name)}</strong><small>${escapeHtml(t.subject)} · ${d.toLocaleDateString()}</small></div><span class="pill">${i<per?'LEARN':i<per*2?'REVISE':'REVIEW'}</span></div><p class="muted">25 min focus + 5 min break · spaced revision 1–4–7</p></div>`;});html+='</div>';$('#timetable-output').innerHTML=html;});
  $('#space-search').addEventListener('input',renderSpaces);$('#space-filter').addEventListener('change',renderSpaces);
  $('#space-list').addEventListener('click',e=>{const id=e.target.dataset.checkin;if(!id)return;activeCheckin=sampleSpaces.find(s=>s.id===id);showCheckin(0);$('#modal').hidden=false;});
  $('#modal-close').addEventListener('click',()=>$('#modal').hidden=true);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#modal').hidden=true;});
  function showCheckin(step) {
    const steps=[
      ['Student password','Demo step only. Enter any non-empty text; do not use a real password.'],
      ['Camera check','Demo only. This does not identify your face or store camera footage.'],
      ['Location check','Demo location confirmation. No GPS or real 100 m geofence is checked.'],
      ['Seat reservation','This records a local demo reservation only; it does not contact campus systems.']
    ];
    $('#checkin-steps').innerHTML=steps.map((s,i)=>`<div class="check-step"><strong>${i<step?'✓ ':i===step?'● ':'○ '}${i+1}. ${s[0]}</strong><p>${s[1]}</p></div>`).join('')+(step===0?'<label class="muted">Demo password<input id="demo-password" type="password" autocomplete="off" style="display:block;width:100%;padding:11px;margin-top:7px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--text)"></label>':'')+`<div class="check-actions"><button id="check-cancel" class="small-btn">Cancel</button><button id="check-next" class="primary">${step===3?'Reserve demo seat':'Continue'}</button></div>`;
    $('#check-cancel').onclick=()=>$('#modal').hidden=true;
    $('#check-next').onclick=()=>{if(step===0&&!$('#demo-password').value){toast('Enter any demo text to continue.');return;}if(step<3){showCheckin(step+1);return;}db.reservations.push({space:activeCheckin.name,date:new Date().toISOString()});save();$('#modal').hidden=true;toast('Demo seat reservation saved locally.');};
  }
  $('#profile-form').addEventListener('submit',e=>{e.preventDefault();const id=$('#student-id').value.trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40);if(!id){toast('Enter a student ID.');return;}profile=id;localStorage.setItem('studyspot-profile',profile);db=loadDb(profile);save();toast('Switched local demo profile.');});
  $('#reset-data').addEventListener('click',()=>{if(!confirm('Delete all StudySpot AI data for this local profile?'))return;localStorage.removeItem('studyspot-data-'+profile);db=loadDb(profile);save();toast('Current profile data reset.');});
  $('#theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('studyspot-theme',document.body.classList.contains('dark')?'dark':'light');});
  const savedTheme=localStorage.getItem('studyspot-theme');if(savedTheme==='dark'||(!savedTheme&&window.matchMedia?.('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark');
  $('#exam-date').min=today();$('#timetable-date').value=today();renderAll();
})();