const IMGS={1: "img/betonnyj-cokol.jpg", 2: "img/zamena-vencov-brus.jpg", 3: "img/dom-na-oporah.jpg", 4: "img/usilenie-gruntov.jpg", 5: "img/gidroizolyaciya-fundamenta.jpg", 6: "img/novyj-venec-gidroizolyaciya.jpg", 7: "img/zamena-vencov-rabota.jpg", 8: "img/brus-pod-srub.jpg", 9: "img/gnilye-vency.jpg", 10: "img/fundament-pod-srub.jpg", 11: "img/gidroizolyaciya-uteplitel.jpg", 12: "img/opalubka-fundamenta.jpg"};
const GAL=[[7,'Замена венцов: старые убираем, новые ставим'],[2,'Новые нижние венцы под резными наличниками'],[12,'Опалубка под новый пояс фундамента'],[6,'Новый брус и гидроизоляция'],[5,'Фундамент с гидроизоляцией и дренажными выпусками'],[4,'Усиление грунта под фундаментной лентой'],[8,'Брус под сруб на месте сгнившего венца'],[11,'Гидроизоляция и утеплитель по периметру'],[1,'Новая цокольная лента под обшитым домом'],[3,'Дом на временных опорах, заливка основания'],[10,'Фундамент под срубом'],[9,'Старый венец срублен, новый брус уложен']];
document.getElementById('gal').innerHTML=GAL.map(g=>`<figure><img src="${IMGS[g[0]]}" alt="${g[1]}" loading="lazy" width="800"><figcaption>${g[1]}</figcaption></figure>`).join('');

/* ---- Квиз. Цены в руб., правятся здесь ---- */
const P={demo:35,beam:65,log:80,waterproof:15,insul:10,fRepair:110,fNew:240,grunt:140,roofM2:50,liftMin:450,liftM:25};
const SZ={s:['До 6×6 м','небольшой дом, периметр около 24 м',24],m:['6×9 м','периметр около 30 м',30],l:['9×10 м','периметр около 40 м',40],xl:['Больше','большой дом или два этажа, около 52 м',52]};
const SV={venzy:'Замена венцов',fRepair:'Ремонт фундамента',fNew:'Замена фундамента',grunt:'Усиление грунтов',roof:'Ремонт кровли',lift:'Только подъём дома'};
const WALL={log:'Бревно',beam:'Брус',other:'Не знаю / другое'};
const ST={local:['Локальная гниль','один венец или угол',.4],one:['Гниль в 1 венце','по всему периметру',1],two:['Гниль в 2–3 венцах','просадка, перекос окон',2.5],unk:['Не знаю','нужен осмотр',1.5]};
const TOWNS=['Минск','Минский район','Борисов','Жодино','Заславль','Фаниполь','Дзержинск','Смолевичи','Логойск','Марьина Горка','Молодечно','Другой населённый пункт'];
const S={sv:[],wall:'',sz:'',st:'',town:'',name:'',phone:'',via:'Звонок',note:'',ok:false};
const steps=[
 {k:'sv',t:'Что нужно сделать?',multi:1,o:Object.entries(SV).map(([v,l])=>[v,l])},
 {k:'wall',t:'Из чего построен дом?',o:Object.entries(WALL)},
 {k:'sz',t:'Какой размер дома?',o:Object.entries(SZ).map(([v,a])=>[v,a[0],a[1]])},
 {k:'st',t:'В каком состоянии нижние венцы?',o:Object.entries(ST).map(([v,a])=>[v,a[0],a[1]])},
 {k:'town',t:'Где находится дом?',two:1,o:TOWNS.map(x=>[x,x])},
 {k:'contact',t:'Куда прислать расчёт?'}
];
let n=0;const box=document.getElementById('qz');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ok(s){return s.k==='contact'?(S.name.trim().length>1&&S.phone.replace(/\D/g,'').length>=9&&S.ok):s.multi?S.sv.length>0:!!S[s.k]}
function calc(){const p=SZ[S.sz||'m'][2],rows=ST[S.st||'unk'][2],rate=S.wall==='log'?P.log:P.beam;let t=0,lift=0;
 const has=v=>S.sv.includes(v);
 if(has('venzy')){t+=p*rows*(P.demo+rate+P.waterproof+P.insul);lift=1}
 if(has('fRepair'))t+=p*P.fRepair;
 if(has('fNew')){t+=p*P.fNew;lift=1}
 if(has('grunt'))t+=p*P.grunt;
 if(has('roof'))t+=Math.pow(p/4,2)*1.3*P.roofM2;
 if(has('lift'))lift=1;
 if(lift)t+=Math.max(P.liftMin,p*P.liftM);
 const r=x=>Math.round(x/10)*10;return[r(t),r(t*1.35)]}
function render(){const s=steps[n];let h=`<div class="bar"><i style="width:${(n+1)/steps.length*100}%"></i></div><div class="qn">Шаг ${n+1} из ${steps.length}</div><h3 class="qt">${s.t}</h3>`;
 if(s.k==='contact'){h+=`<div class="fld"><label>Имя<input id="f-name" autocomplete="name" value="${esc(S.name)}" placeholder="Как к вам обращаться"></label>
 <label>Телефон<input id="f-phone" type="tel" autocomplete="tel" value="${esc(S.phone)}" placeholder="+375 __ ___-__-__"></label>
 <label>Как с вами связаться<select id="f-via" style="font:16px var(--body);padding:12px;border:1.5px solid var(--line);border-radius:8px">${['Звонок','Telegram','WhatsApp','Viber'].map(x=>`<option${S.via===x?' selected':''}>${x}</option>`).join('')}</select></label>
 <label>Комментарий (необязательно)<textarea id="f-note" rows="2" placeholder="Например, адрес или удобное время">${esc(S.note)}</textarea></label>
 <label class="chk"><input type="checkbox" id="f-ok"${S.ok?' checked':''}>Согласен на обработку персональных данных (<a href="privacy.html" target="_blank">политика конфиденциальности</a>)</label></div><p class="err" id="err"></p>`}
 else h+=`<div class="opts${s.two?' two':''}">`+s.o.map(o=>{const on=s.multi?S.sv.includes(o[0]):S[s.k]===o[0];return`<button type="button" class="opt" aria-pressed="${on}" data-v="${esc(o[0])}">${s.multi?'<span class="bx">'+(on?'✓':'')+'</span>':''}<span>${esc(o[1])}${o[2]?'<small>'+esc(o[2])+'</small>':''}</span></button>`}).join('')+'</div>';
 h+=`<div class="qnav"><button type="button" class="back" id="bk"${n?'':' style="visibility:hidden"'}>← Назад</button><button type="button" class="btn" id="nx"${ok(s)?'':' disabled'}>${n===steps.length-1?'Получить расчёт':'Далее'}</button></div>`;
 box.innerHTML=h;
 box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(s.multi){S.sv=S.sv.includes(v)?S.sv.filter(x=>x!==v):[...S.sv,v];render()}else{S[s.k]=v;if(n<steps.length-1){n++;render()}}});
 if(s.k==='contact'){const up=()=>{S.name=g('f-name').value;S.phone=g('f-phone').value;S.via=g('f-via').value;S.note=g('f-note').value;S.ok=g('f-ok').checked;g('nx').disabled=!ok(s)};['f-name','f-phone','f-via','f-note','f-ok'].forEach(i=>g(i).addEventListener('input',up));g('f-ok').addEventListener('change',up)}
 g('bk').onclick=()=>{n--;render()};g('nx').onclick=()=>n<steps.length-1?(n++,render()):send()}
const g=i=>document.getElementById(i);
async function send(){const btn=g('nx');btn.disabled=true;btn.textContent='Отправляем…';const [lo,hi]=calc();
 const data={services:S.sv.map(v=>SV[v]),wall:WALL[S.wall],size:SZ[S.sz][0]+' ('+SZ[S.sz][1]+')',state:ST[S.st][0],town:S.town,name:S.name.trim(),phone:S.phone.trim(),via:S.via,note:S.note.trim(),estimate:lo+' – '+hi+' руб.',page:location.href,website:''};
 let sent=false;try{const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});sent=r.ok&&(await r.json()).ok}catch(e){}
 const fb='https://t.me/zamvec?text='+encodeURIComponent('Заявка с сайта: '+data.services.join(', ')+'. '+data.size+', '+data.town+'. '+data.name+' '+data.phone);
 box.innerHTML=`<div class="res"><div class="bar"><i style="width:100%"></i></div><h3 class="qt" style="margin-top:20px">${sent?'Заявка отправлена':'Расчёт готов'}</h3><p>Ориентировочная стоимость</p><div class="sum">${lo} – ${hi} руб.</div>
 <p>${sent?'Мастер перезвонит вам в течение рабочего дня и уточнит детали. Точную цену назовём после выезда инженера (50 руб.).':'Не удалось отправить заявку автоматически. Нажмите кнопку ниже или позвоните нам: +375 44 587-67-56.'}</p>
 <div class="cta-row" style="justify-content:center;margin-top:18px">${sent?'':`<a class="btn" href="${fb}" target="_blank" rel="noopener">Отправить в Telegram</a>`}<a class="btn ghost" href="tel:+375445876756" style="color:var(--spruce)">Позвонить</a></div></div>`}
render();
