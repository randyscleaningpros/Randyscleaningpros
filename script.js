document.addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('.menu-button');
  const panel=document.querySelector('.menu-panel');
  if(button&&panel){
    const closeMenu=()=>{panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation menu')};
    button.addEventListener('click',()=>{const open=panel.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')});
    panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
    document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!button.contains(e.target))closeMenu()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();button.focus()}});
  }

  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('.menu-panel a').forEach(link=>{
    const target=(link.getAttribute('href')||'').split('#')[0].toLowerCase();
    if(target===current)link.setAttribute('aria-current','page');
  });

  const topButton=document.querySelector('.back-to-top');
  if(topButton){
    const update=()=>topButton.classList.toggle('show',window.scrollY>650);
    window.addEventListener('scroll',update,{passive:true});update();
    topButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  const form=document.getElementById('quoteForm');
  if(form){
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      const data=new FormData(form),lines=[];
      for(const [key,value] of data.entries())if(String(value).trim())lines.push(`${key}: ${value}`);
      const subject=encodeURIComponent("Free Quote Request - Randy's Premier Cleaning");
      const body=encodeURIComponent(lines.join('\n'));
      location.href=`mailto:randyspremiercleaning@gmail.com?subject=${subject}&body=${body}`;
    });
  }
});