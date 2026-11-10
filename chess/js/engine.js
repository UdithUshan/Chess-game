var E = 0;
var WP=1,WN=2,WB=3,WR=4,WQ=5,WK=6;
var BP=7,BN=8,BB=9,BR=10,BQ=11,BK=12;

var SYMBOLS = {};
SYMBOLS[E]=''; SYMBOLS[WP]='♙'; SYMBOLS[WN]='♘'; SYMBOLS[WB]='♗';
SYMBOLS[WR]='♖'; SYMBOLS[WQ]='♕'; SYMBOLS[WK]='♔';
SYMBOLS[BP]='♟'; SYMBOLS[BN]='♞'; SYMBOLS[BB]='♝';
SYMBOLS[BR]='♜'; SYMBOLS[BQ]='♛'; SYMBOLS[BK]='♚';

var VALUES = {};
VALUES[WP]=100; VALUES[WN]=320; VALUES[WB]=330; VALUES[WR]=500; VALUES[WQ]=900; VALUES[WK]=20000;
VALUES[BP]=100; VALUES[BN]=320; VALUES[BB]=330; VALUES[BR]=500; VALUES[BQ]=900; VALUES[BK]=20000;

var PIECE_NAMES = {};
PIECE_NAMES[WP]=''; PIECE_NAMES[WN]='N'; PIECE_NAMES[WB]='B'; PIECE_NAMES[WR]='R'; PIECE_NAMES[WQ]='Q'; PIECE_NAMES[WK]='K';
PIECE_NAMES[BP]=''; PIECE_NAMES[BN]='N'; PIECE_NAMES[BB]='B'; PIECE_NAMES[BR]='R'; PIECE_NAMES[BQ]='Q'; PIECE_NAMES[BK]='K';

function isW(p) { return p>=1 && p<=6; }
function isB(p) { return p>=7 && p<=12; }
function isCol(p,w) { return w ? isW(p) : isB(p); }
function isEn(p,w) { return w ? isB(p) : isW(p); }
function rc(sq) { return [Math.floor(sq/8), sq%8]; }
function sq(r,c) { return r*8+c; }
function ok(r,c) { return r>=0 && r<8 && c>=0 && c<8; }

// PST
var PST = {};
PST[WP]=[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,27,27,10,5,5,0,0,0,25,25,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-25,-25,10,10,5,0,0,0,0,0,0,0,0];
PST[WN]=[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50];
PST[WB]=[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20];
PST[WR]=[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0];
PST[WQ]=[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20];
PST[WK]=[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20];

function flipPST(t){var f=[];for(var r=7;r>=0;r--)for(var c=0;c<8;c++)f.push(t[r*8+c]);return f;}
PST[BP]=flipPST(PST[WP]); PST[BN]=flipPST(PST[WN]); PST[BB]=flipPST(PST[WB]);
PST[BR]=flipPST(PST[WR]); PST[BQ]=flipPST(PST[WQ]); PST[BK]=flipPST(PST[WK]);

function genMoves(b,white,castle,ep) {
    var moves=[];
    for(var s=0;s<64;s++){
        var p=b[s];
        if(!isCol(p,white))continue;
        var R=rc(s),r=R[0],c=R[1];
        if(p===WP){
            if(r>0&&b[sq(r-1,c)]===E){if(r-1===0){[WQ,WR,WB,WN].forEach(function(pr){moves.push({from:s,to:sq(r-1,c),promo:pr});});}else{moves.push({from:s,to:sq(r-1,c)});if(r===6&&b[sq(r-2,c)]===E)moves.push({from:s,to:sq(r-2,c)});}}
            [-1,1].forEach(function(dc){if(ok(r-1,c+dc)){var ts=sq(r-1,c+dc);if(isB(b[ts])||ts===ep){if(r-1===0){[WQ,WR,WB,WN].forEach(function(pr){moves.push({from:s,to:ts,promo:pr});});}else{moves.push({from:s,to:ts});}}}});
        }else if(p===BP){
            if(r<7&&b[sq(r+1,c)]===E){if(r+1===7){[BQ,BR,BB,BN].forEach(function(pr){moves.push({from:s,to:sq(r+1,c),promo:pr});});}else{moves.push({from:s,to:sq(r+1,c)});if(r===1&&b[sq(r+2,c)]===E)moves.push({from:s,to:sq(r+2,c)});}}
            [-1,1].forEach(function(dc){if(ok(r+1,c+dc)){var ts=sq(r+1,c+dc);if(isW(b[ts])||ts===ep){if(r+1===7){[BQ,BR,BB,BN].forEach(function(pr){moves.push({from:s,to:ts,promo:pr});});}else{moves.push({from:s,to:ts});}}}});
        }else if(p===WN||p===BN){
            [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(d){var nr=r+d[0],nc=c+d[1];if(ok(nr,nc)){var ts=sq(nr,nc);if(b[ts]===E||isEn(b[ts],white))moves.push({from:s,to:ts});}});
        }else if(p===WB||p===BB){
            [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){doSlide(b,s,r,c,d[0],d[1],white,moves);});
        }else if(p===WR||p===BR){
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){doSlide(b,s,r,c,d[0],d[1],white,moves);});
        }else if(p===WQ||p===BQ){
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){doSlide(b,s,r,c,d[0],d[1],white,moves);});
        }else if(p===WK||p===BK){
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){var nr=r+d[0],nc=c+d[1];if(ok(nr,nc)){var ts=sq(nr,nc);if(b[ts]===E||isEn(b[ts],white))moves.push({from:s,to:ts});}});
            if(white){
                if(castle.wk&&b[61]===E&&b[62]===E&&b[63]===WR&&!isAtt(b,60,false)&&!isAtt(b,61,false)&&!isAtt(b,62,false))moves.push({from:60,to:62,castle:'wk'});
                if(castle.wq&&b[59]===E&&b[58]===E&&b[57]===E&&b[56]===WR&&!isAtt(b,60,false)&&!isAtt(b,59,false)&&!isAtt(b,58,false))moves.push({from:60,to:58,castle:'wq'});
            }else{
                if(castle.bk&&b[5]===E&&b[6]===E&&b[7]===BR&&!isAtt(b,4,true)&&!isAtt(b,5,true)&&!isAtt(b,6,true))moves.push({from:4,to:6,castle:'bk'});
                if(castle.bq&&b[3]===E&&b[2]===E&&b[1]===E&&b[0]===BR&&!isAtt(b,4,true)&&!isAtt(b,3,true)&&!isAtt(b,2,true))moves.push({from:4,to:2,castle:'bq'});
            }
        }
    }
    return moves;
}

function doSlide(b,s,r,c,dr,dc,white,moves){var nr=r+dr,nc=c+dc;while(ok(nr,nc)){var ts=sq(nr,nc);if(b[ts]===E){moves.push({from:s,to:ts});}else{if(isEn(b[ts],white))moves.push({from:s,to:ts});break;}nr+=dr;nc+=dc;}}

function isAtt(b,s,byW){
    var R=rc(s),r=R[0],c=R[1];
    if(byW){if(ok(r+1,c-1)&&b[sq(r+1,c-1)]===WP)return true;if(ok(r+1,c+1)&&b[sq(r+1,c+1)]===WP)return true;}
    else{if(ok(r-1,c-1)&&b[sq(r-1,c-1)]===BP)return true;if(ok(r-1,c+1)&&b[sq(r-1,c+1)]===BP)return true;}
    var kn=byW?WN:BN;
    var dirs=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for(var i=0;i<dirs.length;i++){var nr=r+dirs[i][0],nc=c+dirs[i][1];if(ok(nr,nc)&&b[sq(nr,nc)]===kn)return true;}
    var bi=byW?WB:BB,qu=byW?WQ:BQ;
    var dd=[[-1,-1],[-1,1],[1,-1],[1,1]];
    for(var i=0;i<dd.length;i++){var nr=r+dd[i][0],nc=c+dd[i][1];while(ok(nr,nc)){var p=b[sq(nr,nc)];if(p!==E){if(p===bi||p===qu)return true;break;}nr+=dd[i][0];nc+=dd[i][1];}}
    var ro=byW?WR:BR;
    var sd=[[-1,0],[1,0],[0,-1],[0,1]];
    for(var i=0;i<sd.length;i++){var nr=r+sd[i][0],nc=c+sd[i][1];while(ok(nr,nc)){var p=b[sq(nr,nc)];if(p!==E){if(p===ro||p===qu)return true;break;}nr+=sd[i][0];nc+=sd[i][1];}}
    var ki=byW?WK:BK;
    var kd=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for(var i=0;i<kd.length;i++){var nr=r+kd[i][0],nc=c+kd[i][1];if(ok(nr,nc)&&b[sq(nr,nc)]===ki)return true;}
    return false;
}

function findK(b,white){var k=white?WK:BK;for(var i=0;i<64;i++)if(b[i]===k)return i;return-1;}
function inChk(b,white){var ks=findK(b,white);return ks>=0&&isAtt(b,ks,!white);}

function doMove(b,m,castle,ep){
    var nb=b.slice(),nc={wk:castle.wk,wq:castle.wq,bk:castle.bk,bq:castle.bq},ne=-1,cap=b[m.to],pc=nb[m.from];
    if((pc===WP||pc===BP)&&m.to===ep){var cs=pc===WP?m.to+8:m.to-8;cap=nb[cs];nb[cs]=E;}
    nb[m.to]=m.promo||pc;nb[m.from]=E;
    if(m.castle){if(m.castle==='wk'){nb[61]=WR;nb[63]=E;}else if(m.castle==='wq'){nb[59]=WR;nb[56]=E;}else if(m.castle==='bk'){nb[5]=BR;nb[7]=E;}else if(m.castle==='bq'){nb[3]=BR;nb[0]=E;}}
    if(pc===WK){nc.wk=false;nc.wq=false;}if(pc===BK){nc.bk=false;nc.bq=false;}
    if(m.from===56||m.to===56)nc.wq=false;if(m.from===63||m.to===63)nc.wk=false;
    if(m.from===0||m.to===0)nc.bq=false;if(m.from===7||m.to===7)nc.bk=false;
    if(pc===WP&&m.from-m.to===16)ne=m.from-8;if(pc===BP&&m.to-m.from===16)ne=m.from+8;
    return{board:nb,castle:nc,ep:ne,captured:cap};
}

function getLegal(b,white,castle,ep){
    var pm=genMoves(b,white,castle,ep),leg=[];
    for(var i=0;i<pm.length;i++){var r=doMove(b,pm[i],castle,ep);if(!inChk(r.board,white))leg.push(pm[i]);}
    return leg;
}

function evalBoard(b){
    var score=0;
    for(var s=0;s<64;s++){var p=b[s];if(p===E)continue;var v=VALUES[p]||0;var pst=PST[p]?PST[p][s]:0;if(isW(p))score+=v+pst;else score-=v+pst;}
    return score;
}

function boardFEN(b){
    var fen='';
    for(var r=0;r<8;r++){var empty=0;for(var c=0;c<8;c++){var p=b[r*8+c];if(p===E)empty++;else{if(empty>0){fen+=empty;empty=0;}var chars={};chars[WP]='P';chars[WN]='N';chars[WB]='B';chars[WR]='R';chars[WQ]='Q';chars[WK]='K';chars[BP]='p';chars[BN]='n';chars[BB]='b';chars[BR]='r';chars[BQ]='q';chars[BK]='k';fen+=chars[p];}}if(empty>0)fen+=empty;if(r<7)fen+='/';}
    return fen;
}

function moveNotation(b,m,res){
    var p=b[m.from],pn=PIECE_NAMES[p]||'',files='abcdefgh',R=rc(m.from),fr=R[0],fc=R[1],T=rc(m.to),tr=T[0],tc=T[1];
    var to=files[tc]+(8-tr),ff=files[fc];
    if(m.castle)return m.castle.endsWith('k')?'O-O':'O-O-O';
    var cap=res.captured!==E&&res.captured!==undefined,not='';
    if(p===WP||p===BP){not=cap?ff+'x'+to:to;if(m.promo)not+='='+PIECE_NAMES[m.promo];}
    else not=pn+(cap?'x':'')+to;
    return not;
}