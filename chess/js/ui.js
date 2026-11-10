(function(){

var G = {
    board: [],
    whiteToMove: true,
    castleRights: {wk:true,wq:true,bk:true,bq:true},
    enPassantSq: -1,
    selectedSq: -1,
    validMoves: [],
    moveHistory: [],
    gameOver: false,
    aiDepth: 3,
    boardFlipped: false,
    whiteCaptured: [],
    blackCaptured: [],
    lastFrom: -1,
    lastTo: -1,
    whiteTime: 600,
    blackTime: 600,
    timer: null,
    pendingPromo: null,
    undoStack: [],
    playerIsWhite: true,
    currentTheme: 'gold',
    currentBoard: 'classic',
    aiThinking: false,

    BOARD_STYLES: {
        classic:{light:'#f0d9b5',dark:'#b58863'},
        walnut:{light:'#deb887',dark:'#8b4513'},
        marble:{light:'#e8e8e8',dark:'#5a6270'},
        midnight:{light:'#4a5568',dark:'#2d3748'}
    },
    THEMES: {
        gold:{accent:'#c9a227',glow:'rgba(201,162,39,0.15)'},
        silver:{accent:'#95a5a6',glow:'rgba(149,165,166,0.15)'},
        blue:{accent:'#3498db',glow:'rgba(52,152,219,0.15)'},
        emerald:{accent:'#2ecc71',glow:'rgba(46,204,113,0.15)'},
        rose:{accent:'#e74c3c',glow:'rgba(231,76,60,0.15)'}
    }
};

function initBoard(){
    G.board=[BR,BN,BB,BQ,BK,BB,BN,BR,BP,BP,BP,BP,BP,BP,BP,BP,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,WP,WP,WP,WP,WP,WP,WP,WP,WR,WN,WB,WQ,WK,WB,WN,WR];
}

function newGame(){
    initBoard();
    G.whiteToMove=true;
    G.castleRights={wk:true,wq:true,bk:true,bq:true};
    G.enPassantSq=-1; G.selectedSq=-1; G.validMoves=[];
    G.moveHistory=[]; G.gameOver=false;
    G.whiteCaptured=[]; G.blackCaptured=[];
    G.lastFrom=-1; G.lastTo=-1;
    G.whiteTime=600; G.blackTime=600;
    G.undoStack=[]; G.pendingPromo=null; G.aiThinking=false;
    killerM=[]; historyT={};
    if(G.timer)clearInterval(G.timer);
    startTimer();
    updatePlayerInfo(); render(); updateStatus(); updateHistory(); updateCaptures(); updateTimers();
    hideThinking();
    if(!G.playerIsWhite)setTimeout(aiTurn,600);
}

function showColorModal(){document.getElementById('colorModal').classList.add('show');}

function selectColor(c){
    document.getElementById('colorModal').classList.remove('show');
    if(c==='random')G.playerIsWhite=Math.random()<0.5;
    else G.playerIsWhite=(c==='white');
    G.boardFlipped=!G.playerIsWhite;
    newGame();
}

function updatePlayerInfo(){
    var tn=document.getElementById('top-name'),tr=document.getElementById('top-role'),ta=document.getElementById('top-avatar');
    var bn=document.getElementById('bottom-name'),br=document.getElementById('bottom-role'),ba=document.getElementById('bottom-avatar');
    if(G.boardFlipped){
        tn.textContent=G.playerIsWhite?'You':'Computer'; tr.textContent='WHITE';
        ta.innerHTML='&#9812;'; ta.style.color='#fff'; ta.style.textShadow='0 0 3px rgba(0,0,0,0.5)';
        bn.textContent=G.playerIsWhite?'Computer':'You'; br.textContent='BLACK';
        ba.innerHTML='&#9818;'; ba.style.color='#000'; ba.style.textShadow='0 0 3px rgba(255,255,255,0.3)';
    }else{
        tn.textContent=G.playerIsWhite?'Computer':'You'; tr.textContent='BLACK';
        ta.innerHTML='&#9818;'; ta.style.color='#000'; ta.style.textShadow='0 0 3px rgba(255,255,255,0.3)';
        bn.textContent=G.playerIsWhite?'You':'Computer'; br.textContent='WHITE';
        ba.innerHTML='&#9812;'; ba.style.color='#fff'; ba.style.textShadow='0 0 3px rgba(0,0,0,0.5)';
    }
}

function setDifficulty(d){
    G.aiDepth=d;
    var btns=document.querySelectorAll('[id^="d"]');
    for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
    document.getElementById('d'+d).classList.add('active');
}

function setTheme(t){
    G.currentTheme=t;
    var theme=G.THEMES[t];
    document.documentElement.style.setProperty('--accent',theme.accent);
    document.documentElement.style.setProperty('--accent-glow',theme.glow);
    var btns=document.querySelectorAll('.color-btn');
    for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
    document.querySelector('.color-'+t).classList.add('active');
}

function setBoardStyle(s){
    G.currentBoard=s;
    var btns=document.querySelectorAll('[id^="b-"]');
    for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
    document.getElementById('b-'+s).classList.add('active');
    render();
}

function showThinking(){document.getElementById('thinking').classList.add('show');}
function hideThinking(){document.getElementById('thinking').classList.remove('show');}

function showGameOver(icon,title,msg){
    document.getElementById('result-icon').textContent=icon;
    document.getElementById('result-title').textContent=title;
    document.getElementById('result-message').textContent=msg;
    document.getElementById('gameOverModal').classList.add('show');
}
function closeGameOver(){document.getElementById('gameOverModal').classList.remove('show');}

function showPromoModal(white){
    var pcs=white?[WQ,WR,WB,WN]:[BQ,BR,BB,BN];
    var html='';
    for(var i=0;i<pcs.length;i++){
        var p=pcs[i];
        var cls=isW(p)?'white-piece':'black-piece';
        html+='<div class="promo-choice '+cls+'" onclick="window.game.selectPromo('+p+')">'+SYMBOLS[p]+'</div>';
    }
    document.getElementById('promo-options').innerHTML=html;
    document.getElementById('promoModal').classList.add('show');
}

function selectPromo(p){
    document.getElementById('promoModal').classList.remove('show');
    if(G.pendingPromo){
        executeMove({from:G.pendingPromo.from,to:G.pendingPromo.to,promo:p});
        G.pendingPromo=null;
    }
}

function aiTurn(){
    if(G.gameOver||G.aiThinking)return;
    G.aiThinking=true;
    updateStatus(); showThinking();
    document.getElementById('thinking-text').textContent='Analyzing position...';
    document.getElementById('thinking-depth').textContent='';

    if(pyAvailable){
        document.getElementById('thinking-text').textContent='Python AI analyzing...';
        getPyMove(G.board,G.whiteToMove,G.castleRights,G.enPassantSq,G.aiDepth,function(pyMove){
            if(pyMove){
                var leg=getLegal(G.board,G.whiteToMove,G.castleRights,G.enPassantSq);
                var found=null;
                for(var i=0;i<leg.length;i++){
                    if(leg[i].from===pyMove.from&&leg[i].to===pyMove.to){
                        if(!pyMove.promo||leg[i].promo===pyMove.promo){found=leg[i];break;}
                    }
                }
                if(found){hideThinking();G.aiThinking=false;executeMove(found);return;}
            }
            jsAiFallback();
        });
    }else{
        setTimeout(jsAiFallback,50);
    }
}

function jsAiFallback(){
    document.getElementById('thinking-text').textContent='Computing...';
    var book=getBookMove(G.board);
    if(book){
        var leg=getLegal(G.board,G.whiteToMove,G.castleRights,G.enPassantSq);
        for(var i=0;i<leg.length;i++){
            if(leg[i].from===book.from&&leg[i].to===book.to){
                hideThinking();G.aiThinking=false;executeMove(leg[i]);return;
            }
        }
    }
    var d,t;
    switch(G.aiDepth){
        case 1:d=2;t=500;break;case 2:d=3;t=1000;break;case 3:d=4;t=1500;break;
        case 4:d=5;t=2000;break;case 5:d=6;t=3000;break;default:d=4;t=1500;
    }
    maxTime=t; killerM=[];
    var result=iterDeep(G.board,G.whiteToMove,G.castleRights,G.enPassantSq,d);
    hideThinking(); G.aiThinking=false;
    if(result.move)executeMove(result.move);
}

function clickSquare(idx){
    if(G.gameOver||G.aiThinking)return;
    var isPlayer=(G.whiteToMove&&G.playerIsWhite)||(!G.whiteToMove&&!G.playerIsWhite);
    if(!isPlayer)return;
    var actual=G.boardFlipped?63-idx:idx;

    if(G.selectedSq>=0){
        var m=null;
        for(var i=0;i<G.validMoves.length;i++){
            if(G.validMoves[i].to===actual){m=G.validMoves[i];break;}
        }
        if(m){
            if(m.promo){G.pendingPromo={from:m.from,to:m.to};showPromoModal(G.whiteToMove);return;}
            executeMove(m);return;
        }
    }

    var pcFn=G.playerIsWhite?isW:isB;
    if(pcFn(G.board[actual])){
        G.selectedSq=actual;
        var all=getLegal(G.board,G.whiteToMove,G.castleRights,G.enPassantSq);
        G.validMoves=[];
        for(var i=0;i<all.length;i++){if(all[i].from===actual)G.validMoves.push(all[i]);}
        render();
        createRipple(idx);
    }else{
        G.selectedSq=-1; G.validMoves=[]; render();
    }
}

function executeMove(m){
    G.undoStack.push({
        board:G.board.slice(),castle:{wk:G.castleRights.wk,wq:G.castleRights.wq,bk:G.castleRights.bk,bq:G.castleRights.bq},
        ep:G.enPassantSq,white:G.whiteToMove,lastFrom:G.lastFrom,lastTo:G.lastTo,
        wCap:G.whiteCaptured.slice(),bCap:G.blackCaptured.slice(),history:G.moveHistory.slice()
    });

    var r=doMove(G.board,m,G.castleRights,G.enPassantSq);

    if(r.captured&&r.captured!==E){
        createCaptureParticles(m.to);
        if(G.whiteToMove)G.whiteCaptured.push(r.captured);
        else G.blackCaptured.push(r.captured);
    }else{
        createGlowParticles(m.to);
    }

    var notation=moveNotation(G.board,m,r);
    G.board=r.board; G.castleRights=r.castle; G.enPassantSq=r.ep;
    G.lastFrom=m.from; G.lastTo=m.to; G.selectedSq=-1; G.validMoves=[];
    G.whiteToMove=!G.whiteToMove;

    var leg=getLegal(G.board,G.whiteToMove,G.castleRights,G.enPassantSq);
    var chk=inChk(G.board,G.whiteToMove);
    if(leg.length===0){notation+=chk?'#':' \u00BD';G.gameOver=true;}
    else if(chk)notation+='+';
    G.moveHistory.push(notation);

    render(); updateStatus(); updateHistory(); updateCaptures();
    if(G.gameOver){endGame();return;}
    var isAI=(G.whiteToMove&&!G.playerIsWhite)||(!G.whiteToMove&&G.playerIsWhite);
    if(isAI&&!G.gameOver)setTimeout(aiTurn,300);
}

function endGame(){
    if(G.timer)clearInterval(G.timer);
    var chk=inChk(G.board,G.whiteToMove);
    var leg=getLegal(G.board,G.whiteToMove,G.castleRights,G.enPassantSq);
    setTimeout(function(){
        if(leg.length===0&&chk){
            var won=(G.whiteToMove&&!G.playerIsWhite)||(!G.whiteToMove&&G.playerIsWhite);
            if(won)showGameOver('\u2654','Victory','Checkmate. You have won.');
            else showGameOver('\u265A','Defeat','Checkmate. The computer wins.');
        }else{showGameOver('\u00BD','Draw','Stalemate. The game is drawn.');}
    },400);
}

function undoMove(){
    if(G.undoStack.length<2||G.aiThinking)return;
    if(G.gameOver){closeGameOver();G.gameOver=false;}
    for(var i=0;i<2&&G.undoStack.length>0;i++){
        var s=G.undoStack.pop();
        G.board=s.board; G.castleRights=s.castle; G.enPassantSq=s.ep; G.whiteToMove=s.white;
        G.lastFrom=s.lastFrom; G.lastTo=s.lastTo; G.whiteCaptured=s.wCap; G.blackCaptured=s.bCap; G.moveHistory=s.history;
    }
    G.selectedSq=-1; G.validMoves=[];
    render(); updateStatus(); updateHistory(); updateCaptures();
}

function startTimer(){
    if(G.timer)clearInterval(G.timer);
    G.timer=setInterval(function(){
        if(G.gameOver||G.aiThinking)return;
        if(G.whiteToMove)G.whiteTime--;else G.blackTime--;
        if(G.whiteTime<=0||G.blackTime<=0){G.gameOver=true;showGameOver('\u23F1','Time','Time has expired.');}
        updateTimers();
    },1000);
}

function updateTimers(){
    var wm=Math.floor(G.whiteTime/60),ws=G.whiteTime%60;
    var bm=Math.floor(G.blackTime/60),bs=G.blackTime%60;
    var wt=wm+':'+(ws<10?'0':'')+ws,bt=bm+':'+(bs<10?'0':'')+bs;
    if(G.boardFlipped){document.getElementById('top-timer').textContent=wt;document.getElementById('bottom-timer').textContent=bt;}
    else{document.getElementById('top-timer').textContent=bt;document.getElementById('bottom-timer').textContent=wt;}
}

function render(){
    var el=document.getElementById('board'),html='';
    var style=G.BOARD_STYLES[G.currentBoard];
    for(var i=0;i<64;i++){
        var s=G.boardFlipped?63-i:i;
        var R=rc(s),r=R[0],c=R[1];
        var light=(r+c)%2===0;
        var cls='square '+(light?'light':'dark');
        if(s===G.selectedSq)cls+=' selected';
        if(s===G.lastFrom||s===G.lastTo)cls+=' last-move';
        var isValid=false;
        for(var j=0;j<G.validMoves.length;j++){if(G.validMoves[j].to===s){isValid=true;break;}}
        if(isValid)cls+=G.board[s]!==E?' valid-capture':' valid-move';
        var wk=findK(G.board,true),bk=findK(G.board,false);
        if(s===wk&&inChk(G.board,true))cls+=' check';
        if(s===bk&&inChk(G.board,false))cls+=' check';
        var p=G.board[s];
        var pCls=isW(p)?'white-piece':'black-piece';
        var ph=p!==E?'<span class="piece '+pCls+'">'+SYMBOLS[p]+'</span>':'';
        var bg=light?style.light:style.dark;
        html+='<div class="'+cls+'" style="background:'+bg+'" onclick="window.game.clickSquare('+i+')">'+ph+'</div>';
    }
    el.innerHTML=html;
    var ranks=G.boardFlipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
    var files=G.boardFlipped?'hgfedcba':'abcdefgh';
    var rhtml='',fhtml='';
    for(var i=0;i<8;i++){rhtml+='<div class="board-label">'+ranks[i]+'</div>';fhtml+='<div class="board-label">'+files[i]+'</div>';}
    document.getElementById('rank-labels').innerHTML=rhtml;
    document.getElementById('file-labels').innerHTML=fhtml;
    var ta,ba;
    if(G.boardFlipped){ta=G.whiteToMove;ba=!G.whiteToMove;}else{ta=!G.whiteToMove;ba=G.whiteToMove;}
    document.getElementById('top-player').classList.toggle('active',ta);
    document.getElementById('bottom-player').classList.toggle('active',ba);
}

function updateStatus(){
    var el=document.getElementById('status'),txt=el.querySelector('.status-text');
    el.className='status-bar';
    if(G.gameOver){txt.textContent='Game Over';return;}
    var chk=inChk(G.board,G.whiteToMove);
    var isP=(G.whiteToMove&&G.playerIsWhite)||(!G.whiteToMove&&!G.playerIsWhite);
    if(G.aiThinking){txt.textContent='Computer is thinking...';el.classList.add('thinking');}
    else if(isP){if(chk){txt.textContent='Check';el.classList.add('check');}else txt.textContent='Your turn';}
    else{txt.textContent="Computer's turn";}
}

function updateHistory(){
    var el=document.getElementById('history-list'),html='';
    for(var i=0;i<G.moveHistory.length;i+=2){
        var n=Math.floor(i/2)+1,w=G.moveHistory[i]||'',b=G.moveHistory[i+1]||'';
        var wc=i===G.moveHistory.length-1?' current':'',bc=i+1===G.moveHistory.length-1?' current':'';
        html+='<span class="move-number">'+n+'.</span><span class="move-white'+wc+'">'+w+'</span><span class="move-black'+bc+'">'+b+'</span>';
    }
    el.innerHTML=html;el.scrollTop=el.scrollHeight;
}

function updateCaptures(){
    var tc,bc;
    if(G.boardFlipped){tc=G.whiteCaptured;bc=G.blackCaptured;}
    else{tc=G.blackCaptured;bc=G.whiteCaptured;}
    var tStr='',bStr='';
    for(var i=0;i<tc.length;i++)tStr+=SYMBOLS[tc[i]];
    for(var i=0;i<bc.length;i++)bStr+=SYMBOLS[bc[i]];
    document.getElementById('top-captures').textContent=tStr;
    document.getElementById('bottom-captures').textContent=bStr;
}

function flipBoard(){
    G.boardFlipped=!G.boardFlipped;
    updatePlayerInfo(); render(); updateCaptures(); updateTimers();
}

document.addEventListener('keydown',function(e){
    if(e.key==='z'&&e.ctrlKey)undoMove();
    if(e.key==='n'){closeGameOver();showColorModal();}
    if(e.key==='f')flipBoard();
    if(e.key==='Escape'){closeGameOver();document.getElementById('promoModal').classList.remove('show');}
});

window.game = {
    selectColor: selectColor,
    showColorModal: showColorModal,
    newGame: newGame,
    setDifficulty: setDifficulty,
    setTheme: setTheme,
    setBoardStyle: setBoardStyle,
    undoMove: undoMove,
    flipBoard: flipBoard,
    clickSquare: clickSquare,
    selectPromo: selectPromo,
    closeGameOver: closeGameOver,
    get boardFlipped(){ return G.boardFlipped; }
};

})();