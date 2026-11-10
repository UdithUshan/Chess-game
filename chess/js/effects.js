function createRipple(sqIdx){
    var cells=document.querySelectorAll('.square');
    if(!cells[sqIdx])return;
    var cell=cells[sqIdx];
    var ripple=document.createElement('div');
    ripple.className='ripple';
    ripple.style.width='60px';
    ripple.style.height='60px';
    ripple.style.left='2px';
    ripple.style.top='2px';
    cell.appendChild(ripple);
    setTimeout(function(){ripple.remove();},500);
}

function createGlowParticles(sqVal){
    var actual=window.game.boardFlipped?63-sqVal:sqVal;
    var cells=document.querySelectorAll('.square');
    if(!cells[actual])return;
    var rect=cells[actual].getBoundingClientRect();
    var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    for(var i=0;i<6;i++){
        var p=document.createElement('div');
        p.className='particle glow-particle';
        var ox=(Math.random()-0.5)*30,oy=(Math.random()-0.5)*30;
        p.style.left=(cx+ox)+'px';
        p.style.top=(cy+oy)+'px';
        document.body.appendChild(p);
        setTimeout(function(el){return function(){el.remove();};}(p),600);
    }
}

function createCaptureParticles(sqVal){
    var actual=window.game.boardFlipped?63-sqVal:sqVal;
    var cells=document.querySelectorAll('.square');
    if(!cells[actual])return;
    var rect=cells[actual].getBoundingClientRect();
    var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    for(var i=0;i<8;i++){
        var p=document.createElement('div');
        p.className='particle capture-particle';
        p.textContent='\u2726';
        var angle=(Math.PI*2*i)/8,dist=50+Math.random()*30;
        p.style.left=cx+'px';
        p.style.top=cy+'px';
        p.style.setProperty('--tx',(Math.cos(angle)*dist)+'px');
        p.style.setProperty('--ty',(Math.sin(angle)*dist)+'px');
        p.style.color='var(--accent)';
        document.body.appendChild(p);
        setTimeout(function(el){return function(){el.remove();};}(p),800);
    }
}