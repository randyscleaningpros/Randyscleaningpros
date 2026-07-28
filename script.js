
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if(menuBtn && nav){
  menuBtn.addEventListener('click',()=>{
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')));

const year = document.querySelector('[data-year]');
if(year) year.textContent = new Date().getFullYear();

const quoteForm = document.querySelector('#quoteForm');
if(quoteForm){
  quoteForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = new FormData(quoteForm);
    const name = data.get('name') || '';
    const service = data.get('service') || '';
    const home = data.get('home') || '';
    const frequency = data.get('frequency') || '';
    const notes = data.get('notes') || '';
    const summary = `Quote request from ${name}\nService: ${service}\nHome/space: ${home}\nFrequency: ${frequency}\nNotes: ${notes}`;
    const out = document.querySelector('#quoteSummary');
    if(out){
      out.textContent = summary;
      out.hidden = false;
      out.scrollIntoView({behavior:'smooth', block:'center'});
    }
  });
}
