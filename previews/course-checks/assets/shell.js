(function () {
  var params = new URLSearchParams(location.search), mode = ['revision', 'matching'].includes(params.get('mode')) ? params.get('mode') : 'quiz', rev = mode !== 'quiz';
  var source = document.getElementById(rev ? 'block-demo-accordion' : 'block-demo-form');
  document.getElementById(rev ? 'block-demo-form' : 'block-demo-accordion').remove(); source.hidden = false;
  var answers = [['Study B'], ['Move into open shade', 'Use a large diffuser'], ['Behind the subject']];
  var feedback = ['Look at the transition between light and shadow, rather than brightness alone.', 'A larger apparent light source creates softer transitions between light and shade.', 'Backlight can create a bright rim around the subject.'];
  var qs = rev ? Array.from(source.querySelectorAll('.accordion-item')).map(function (r) { return { type: 'revision', prompt: r.querySelector('.accordion-item__title').textContent.trim(), options: [], answer: r.querySelector('.accordion-item__description').textContent.trim() }; }) : Array.from(source.querySelectorAll('fieldset')).map(function (f) { return { type: f.classList.contains('checkbox') ? 'multiple' : 'single', prompt: f.querySelector('legend').textContent.trim(), options: Array.from(f.querySelectorAll('label')).map(function (l) { return l.textContent.trim(); }) }; });
  var choices = {layout:['editorial','compact'],surface:['card','inline'],corners:['inherit','soft','square'],motion:['full','off']}, prefs = {};
  Object.keys(choices).forEach(function(k){prefs[k]=choices[k].includes(params.get(k))?params.get(k):choices[k][0];});prefs.accent=/^#[0-9a-f]{6}$/i.test(params.get('accent')||'')?params.get('accent'):'';
  var config = { version: 1, title: mode === 'matching' ? 'The language of light' : rev ? 'A moment to recall' : 'Read the light', mode: mode, appearance: prefs, pass: rev ? 0 : 80, questions: qs.map(function (q, i) { return { signature: JSON.stringify([q.type, q.prompt, q.options.slice().sort(), q.answer || '']), correct: rev ? [] : answers[i], feedback: rev ? '' : feedback[i] }; }) };
  if (!rev) {
    config.questions[0].hint = 'Compare the edges of the shadows on the pedestal.';
    config.questions[0].choiceFeedback = [{ option: 'Study A', text: 'The crisp shadow edge suggests a small, direct light source.' }, { option: 'Study B', text: 'Yes. The shadow fades gradually, which is characteristic of diffused light.' }, { option: 'Study C', text: 'The illuminated rim tells you the light is behind the subject. Direction and softness are different qualities.' }];
    config.questions[0].media = { options: [{ option: 'Study A', src: new URL('assets/direct.svg', location.href).href, alt: 'A sphere on a pedestal casts a long shadow with a sharply defined edge.' }, { option: 'Study B', src: new URL('assets/diffused.svg', location.href).href, alt: 'A sphere on a pedestal has gentle tonal transitions and a faint, blurred shadow.' }, { option: 'Study C', src: new URL('assets/backlit.svg', location.href).href, alt: 'A dark sphere has a bright edge on its right side and casts a shadow toward the viewer.' }] };
  }
  var s = document.createElement('script'); s.type = 'application/json'; s.dataset.ccConfig = ''; s.textContent = JSON.stringify(config); document.querySelector('[data-course-checks]').appendChild(s);
  window.demoFormSubmits = 0; document.addEventListener('submit', function (e) { e.preventDefault(); window.demoFormSubmits++; });
  var dialog = document.getElementById('appearance-dialog'), opener = document.querySelector('[data-appearance-open]'), beforeOverflow;
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  function syncLinks() {
    var next = new URLSearchParams(location.search); next.set('theme',document.body.dataset.theme);
    Object.keys(choices).forEach(function(k){next.set(k,prefs[k]);});if(prefs.accent)next.set('accent',prefs.accent);else next.delete('accent');
    history.replaceState({},'',location.pathname+'?'+next.toString());
    document.querySelectorAll('[data-mode]').forEach(function(a){var q=new URLSearchParams(next);q.set('mode',a.dataset.mode);q.delete('coursechecks');a.href='?'+q.toString();});
    var setup=new URLSearchParams(next);setup.set('mode',mode);setup.set('coursechecks','setup');document.getElementById('setup-link').href='?'+setup.toString();
  }
  window.setDemoTheme = function (name) {
    var theme = name === 'dark' ? 'ink' : name;if(!['paper','ink','sage'].includes(theme))theme='paper';
    document.body.dataset.theme = theme;document.querySelector('.page-section').dataset.sectionTheme=theme==='ink'?'dark':'light';document.getElementById('theme').value=theme;
    document.querySelectorAll('[data-theme-preset]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.themePreset===theme));});
    document.querySelectorAll('[data-course-checks]').forEach(function(e){if(e.__ssk)e.__ssk.retheme();});syncLinks();
  };
  function apply() {
    Object.keys(choices).forEach(function(k){prefs[k]=document.getElementById(k).value;});prefs.accent=document.getElementById('custom-accent').checked?document.getElementById('accent').value:'';
    document.body.dataset.motion=prefs.motion;var e=document.querySelector('[data-course-checks]');if(e.__ssk)e.__ssk.updateAppearance(prefs);syncLinks();
    if(prefs.motion==='off')dialog.getAnimations().forEach(function(a){a.cancel();});
  }
  Object.keys(choices).forEach(function(k){document.getElementById(k).value=prefs[k];});document.getElementById('custom-accent').checked=!!prefs.accent;if(prefs.accent)document.getElementById('accent').value=prefs.accent;
  document.body.dataset.motion=prefs.motion;
  document.querySelector('[data-mode="'+mode+'"]').setAttribute('aria-current','page');
  window.setDemoTheme(params.get('theme')||'paper');
  document.getElementById('theme').addEventListener('change',function(e){window.setDemoTheme(e.target.value);});
  document.querySelectorAll('[data-theme-preset]').forEach(function(b){b.addEventListener('click',function(){window.setDemoTheme(b.dataset.themePreset);});});
  Object.keys(choices).concat(['accent','custom-accent']).forEach(function(k){document.getElementById(k).addEventListener('change',apply);});
  opener.addEventListener('click',function(){beforeOverflow=document.documentElement.style.overflow;dialog.showModal();document.documentElement.style.overflow='hidden';dialog.querySelector('[data-appearance-close]').focus();if(!mq.matches&&prefs.motion!=='off')dialog.animate([{opacity:0,transform:innerWidth<600?'translateY(32px)':'translateX(24px)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});});
  document.querySelectorAll('[data-appearance-close]').forEach(function(b){b.addEventListener('click',function(){dialog.close();});});
  dialog.addEventListener('close',function(){document.documentElement.style.overflow=beforeOverflow;opener.focus({preventScroll:true});});
  dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  document.querySelector('[data-appearance-reset]').addEventListener('click',function(){Object.keys(choices).forEach(function(k){document.getElementById(k).value=choices[k][0];});document.getElementById('custom-accent').checked=false;document.getElementById('accent').value='#356149';apply();window.setDemoTheme('paper');});
  if(params.get('coursechecks')==='setup'){document.querySelector('h1').textContent='Set up your activity.';document.querySelector('.intro .eyebrow').textContent='Course Checks / Creator setup';document.querySelector('.activity-tabs').hidden=true;}
})();
