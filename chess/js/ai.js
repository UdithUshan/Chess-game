var BOOK={
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR':[{from:52,to:36},{from:51,to:35},{from:62,to:45},{from:54,to:38}],
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR':[{from:12,to:28},{from:10,to:26},{from:12,to:20},{from:6,to:21}],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR':[{from:11,to:27},{from:6,to:21},{from:12,to:20}],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR':[{from:62,to:45},{from:61,to:25},{from:57,to:42}],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R':[{from:1,to:18},{from:6,to:21}]
};

var killerM=[];
var historyT={};
var searchStart=0;
var maxTime=2000;
var searchStop=false;
var pyAvailable=false;

function checkPyServer(){
    var xhr=new XMLHttpRequest();
    xhr.open('GET','/api/health',true);
    xhr.timeout=1500;
    xhr.onload=function(){if(xhr.status===200){pyAvailable=true;console.log('Python AI connected');}};
    xhr.onerror=function(){pyAvailable=false;};
    xhr.ontimeout=function(){pyAvailable=false;};
    try{xhr.send();}catch(e){pyAvailable=false;}
}
checkPyServer();

function getBookMove(b){
    var fen=boardFEN(b);
    var moves=BOOK[fen];
    if(moves&&moves.length>0)return moves[Math.floor(Math.random()*moves.length)];
    return null;
}

function getPyMove(boardArr,wtm,castle,ep,diff,callback){
    var xhr=new XMLHttpRequest();
    xhr.open('POST','/api/move',true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.timeout=10000;
    xhr.onload=function(){
        if(xhr.status===200){
            try{
                var data=JSON.parse(xhr.responseText);
                var depthEl=document.getElementById('thinking-depth');
                if(depthEl)depthEl.textContent='Depth: '+data.depth+' | '+data.nodes+' nodes | '+data.time+'s';
                callback({from:data.from,to:data.to,promo:data.promo||undefined,castle:data.castle||undefined});
            }catch(e){callback(null);}
        }else{callback(null);}
    };
    xhr.onerror=function(){callback(null);};
    xhr.ontimeout=function(){callback(null);};
    try{
        xhr.send(JSON.stringify({board:boardArr,white_to_move:wtm,castle_rights:castle,en_passant:ep,difficulty:diff}));
    }catch(e){callback(null);}
}

function scoreM(b,m,ply){
    var s=0;
    if(b[m.to]!==E)s+=10000+(VALUES[b[m.to]]||0)*10-(VALUES[b[m.from]]||0);
    if(m.promo)s+=9000;
    if(killerM[ply]&&killerM[ply].from===m.from&&killerM[ply].to===m.to)s+=8000;
    var key=m.from*64+m.to;
    if(historyT[key])s+=historyT[key];
    if(m.to===27||m.to===28||m.to===35||m.to===36)s+=50;
    return s;
}

function orderM(b,moves,ply){
    var scored=[];
    for(var i=0;i<moves.length;i++){scored.push({m:moves[i],s:scoreM(b,moves[i],ply)});}
    scored.sort(function(a,b){return b.s-a.s;});
    var result=[];
    for(var i=0;i<scored.length;i++)result.push(scored[i].m);
    return result;
}

function quiesce(b,alpha,beta,white,castle,ep){
    if(Date.now()-searchStart>maxTime){searchStop=true;return 0;}
    var stand=evalBoard(b);if(!white)stand=-stand;
    if(stand>=beta)return beta;
    if(stand>alpha)alpha=stand;
    var moves=getLegal(b,white,castle,ep);
    for(var i=0;i<moves.length;i++){
        var m=moves[i];
        if(b[m.to]===E&&!m.promo)continue;
        var r=doMove(b,m,castle,ep);
        var score=-quiesce(r.board,-beta,-alpha,!white,r.castle,r.ep);
        if(searchStop)return 0;
        if(score>=beta)return beta;
        if(score>alpha)alpha=score;
    }
    return alpha;
}

function minimax(b,depth,alpha,beta,white,castle,ep,ply){
    if(searchStop)return{score:0};
    if(Date.now()-searchStart>maxTime){searchStop=true;return{score:0};}
    if(depth===0)return{score:quiesce(b,alpha,beta,white,castle,ep)};
    var moves=getLegal(b,white,castle,ep);
    if(moves.length===0){if(inChk(b,white))return{score:-20000+ply};return{score:0};}
    moves=orderM(b,moves,ply);
    var best=moves[0],bestScore=-999999;
    for(var i=0;i<moves.length;i++){
        var m=moves[i],r=doMove(b,m,castle,ep),score;
        if(i>=4&&depth>=3&&b[m.to]===E&&!m.promo&&!inChk(r.board,!white)){
            var res=minimax(r.board,depth-2,-beta,-alpha,!white,r.castle,r.ep,ply+1);
            score=-res.score;
            if(score>alpha){res=minimax(r.board,depth-1,-beta,-alpha,!white,r.castle,r.ep,ply+1);score=-res.score;}
        }else{
            var res=minimax(r.board,depth-1,-beta,-alpha,!white,r.castle,r.ep,ply+1);
            score=-res.score;
        }
        if(searchStop)return{score:0};
        if(score>bestScore){bestScore=score;best=m;}
        alpha=Math.max(alpha,score);
        if(alpha>=beta){
            if(b[m.to]===E){killerM[ply]=m;var key=m.from*64+m.to;historyT[key]=(historyT[key]||0)+depth*depth;}
            break;
        }
    }
    return{score:bestScore,move:best};
}

function iterDeep(b,white,castle,ep,maxD){
    searchStart=Date.now();searchStop=false;
    var bestMove=null,bestScore=-999999;
    for(var depth=1;depth<=maxD;depth++){
        if(searchStop)break;
        var result=minimax(b,depth,-999999,999999,white,castle,ep,0);
        if(!searchStop&&result.move){
            bestMove=result.move;bestScore=result.score;
            var depthEl=document.getElementById('thinking-depth');
            if(depthEl)depthEl.textContent='Depth: '+depth;
        }
        if(Date.now()-searchStart>maxTime*0.8)break;
    }
    return{move:bestMove,score:bestScore};
}