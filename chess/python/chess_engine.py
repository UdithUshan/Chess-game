class Piece:
    E=0; WP=1; WN=2; WB=3; WR=4; WQ=5; WK=6
    BP=7; BN=8; BB=9; BR=10; BQ=11; BK=12
    
    @staticmethod
    def is_white(p): return 1 <= p <= 6
    @staticmethod
    def is_black(p): return 7 <= p <= 12
    @staticmethod
    def is_color(p, w): return Piece.is_white(p) if w else Piece.is_black(p)
    @staticmethod
    def is_enemy(p, w): return Piece.is_black(p) if w else Piece.is_white(p)

P = Piece

class ChessBoard:
    def __init__(self):
        self.board = [
            P.BR,P.BN,P.BB,P.BQ,P.BK,P.BB,P.BN,P.BR,
            P.BP,P.BP,P.BP,P.BP,P.BP,P.BP,P.BP,P.BP,
            0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,
            P.WP,P.WP,P.WP,P.WP,P.WP,P.WP,P.WP,P.WP,
            P.WR,P.WN,P.WB,P.WQ,P.WK,P.WB,P.WN,P.WR
        ]
        self.white_to_move = True
        self.castle_rights = {'wk':True,'wq':True,'bk':True,'bq':True}
        self.en_passant = -1

    def copy(self):
        b = ChessBoard.__new__(ChessBoard)
        b.board = list(self.board)
        b.white_to_move = self.white_to_move
        b.castle_rights = dict(self.castle_rights)
        b.en_passant = self.en_passant
        return b

    @staticmethod
    def rc(s): return s//8, s%8
    @staticmethod
    def sq(r,c): return r*8+c
    @staticmethod
    def ok(r,c): return 0<=r<8 and 0<=c<8

    def gen_moves(self):
        moves = []
        w = self.white_to_move
        for s in range(64):
            p = self.board[s]
            if not P.is_color(p, w): continue
            r, c = self.rc(s)
            
            if p == P.WP:
                if r>0 and self.board[self.sq(r-1,c)]==0:
                    if r-1==0:
                        for pr in [P.WQ,P.WR,P.WB,P.WN]: moves.append({'from':s,'to':self.sq(r-1,c),'promo':pr})
                    else:
                        moves.append({'from':s,'to':self.sq(r-1,c)})
                        if r==6 and self.board[self.sq(r-2,c)]==0: moves.append({'from':s,'to':self.sq(r-2,c)})
                for dc in [-1,1]:
                    if self.ok(r-1,c+dc):
                        ts = self.sq(r-1,c+dc)
                        if P.is_black(self.board[ts]) or ts==self.en_passant:
                            if r-1==0:
                                for pr in [P.WQ,P.WR,P.WB,P.WN]: moves.append({'from':s,'to':ts,'promo':pr})
                            else: moves.append({'from':s,'to':ts})

            elif p == P.BP:
                if r<7 and self.board[self.sq(r+1,c)]==0:
                    if r+1==7:
                        for pr in [P.BQ,P.BR,P.BB,P.BN]: moves.append({'from':s,'to':self.sq(r+1,c),'promo':pr})
                    else:
                        moves.append({'from':s,'to':self.sq(r+1,c)})
                        if r==1 and self.board[self.sq(r+2,c)]==0: moves.append({'from':s,'to':self.sq(r+2,c)})
                for dc in [-1,1]:
                    if self.ok(r+1,c+dc):
                        ts = self.sq(r+1,c+dc)
                        if P.is_white(self.board[ts]) or ts==self.en_passant:
                            if r+1==7:
                                for pr in [P.BQ,P.BR,P.BB,P.BN]: moves.append({'from':s,'to':ts,'promo':pr})
                            else: moves.append({'from':s,'to':ts})

            elif p in (P.WN, P.BN):
                for dr,dc in [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]:
                    nr,nc = r+dr,c+dc
                    if self.ok(nr,nc):
                        ts = self.sq(nr,nc)
                        if self.board[ts]==0 or P.is_enemy(self.board[ts],w): moves.append({'from':s,'to':ts})

            elif p in (P.WB,P.BB):
                for dr,dc in [(-1,-1),(-1,1),(1,-1),(1,1)]: self._slide(s,r,c,dr,dc,w,moves)
            elif p in (P.WR,P.BR):
                for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]: self._slide(s,r,c,dr,dc,w,moves)
            elif p in (P.WQ,P.BQ):
                for dr,dc in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]: self._slide(s,r,c,dr,dc,w,moves)
            elif p in (P.WK,P.BK):
                for dr,dc in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
                    nr,nc = r+dr,c+dc
                    if self.ok(nr,nc):
                        ts = self.sq(nr,nc)
                        if self.board[ts]==0 or P.is_enemy(self.board[ts],w): moves.append({'from':s,'to':ts})
                if w:
                    if self.castle_rights.get('wk') and self.board[61]==0 and self.board[62]==0 and self.board[63]==P.WR:
                        if not self.is_attacked(60,False) and not self.is_attacked(61,False) and not self.is_attacked(62,False):
                            moves.append({'from':60,'to':62,'castle':'wk'})
                    if self.castle_rights.get('wq') and self.board[59]==0 and self.board[58]==0 and self.board[57]==0 and self.board[56]==P.WR:
                        if not self.is_attacked(60,False) and not self.is_attacked(59,False) and not self.is_attacked(58,False):
                            moves.append({'from':60,'to':58,'castle':'wq'})
                else:
                    if self.castle_rights.get('bk') and self.board[5]==0 and self.board[6]==0 and self.board[7]==P.BR:
                        if not self.is_attacked(4,True) and not self.is_attacked(5,True) and not self.is_attacked(6,True):
                            moves.append({'from':4,'to':6,'castle':'bk'})
                    if self.castle_rights.get('bq') and self.board[3]==0 and self.board[2]==0 and self.board[1]==0 and self.board[0]==P.BR:
                        if not self.is_attacked(4,True) and not self.is_attacked(3,True) and not self.is_attacked(2,True):
                            moves.append({'from':4,'to':2,'castle':'bq'})
        return moves

    def _slide(self, s, r, c, dr, dc, w, moves):
        nr, nc = r+dr, c+dc
        while self.ok(nr, nc):
            ts = self.sq(nr, nc)
            if self.board[ts] == 0: moves.append({'from':s,'to':ts})
            else:
                if P.is_enemy(self.board[ts], w): moves.append({'from':s,'to':ts})
                break
            nr += dr; nc += dc

    def is_attacked(self, s, by_white):
        r, c = self.rc(s)
        if by_white:
            if self.ok(r+1,c-1) and self.board[self.sq(r+1,c-1)]==P.WP: return True
            if self.ok(r+1,c+1) and self.board[self.sq(r+1,c+1)]==P.WP: return True
        else:
            if self.ok(r-1,c-1) and self.board[self.sq(r-1,c-1)]==P.BP: return True
            if self.ok(r-1,c+1) and self.board[self.sq(r-1,c+1)]==P.BP: return True

        kn = P.WN if by_white else P.BN
        for dr,dc in [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]:
            nr,nc = r+dr,c+dc
            if self.ok(nr,nc) and self.board[self.sq(nr,nc)]==kn: return True

        bi = P.WB if by_white else P.BB
        qu = P.WQ if by_white else P.BQ
        for dr,dc in [(-1,-1),(-1,1),(1,-1),(1,1)]:
            nr,nc = r+dr,c+dc
            while self.ok(nr,nc):
                p = self.board[self.sq(nr,nc)]
                if p != 0:
                    if p==bi or p==qu: return True
                    break
                nr+=dr; nc+=dc

        ro = P.WR if by_white else P.BR
        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr,nc = r+dr,c+dc
            while self.ok(nr,nc):
                p = self.board[self.sq(nr,nc)]
                if p != 0:
                    if p==ro or p==qu: return True
                    break
                nr+=dr; nc+=dc

        ki = P.WK if by_white else P.BK
        for dr,dc in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
            nr,nc = r+dr,c+dc
            if self.ok(nr,nc) and self.board[self.sq(nr,nc)]==ki: return True
        return False

    def find_king(self, white):
        k = P.WK if white else P.BK
        for i in range(64):
            if self.board[i] == k: return i
        return -1

    def in_check(self):
        ks = self.find_king(self.white_to_move)
        return ks >= 0 and self.is_attacked(ks, not self.white_to_move)

    def make_move(self, m):
        nb = self.copy()
        b = nb.board
        piece = b[m['from']]
        captured = b[m['to']]

        if piece in (P.WP, P.BP) and m['to'] == self.en_passant:
            cs = m['to']+8 if piece==P.WP else m['to']-8
            captured = b[cs]; b[cs] = 0

        b[m['to']] = m.get('promo', piece)
        b[m['from']] = 0

        if 'castle' in m:
            if m['castle']=='wk': b[61]=P.WR; b[63]=0
            elif m['castle']=='wq': b[59]=P.WR; b[56]=0
            elif m['castle']=='bk': b[5]=P.BR; b[7]=0
            elif m['castle']=='bq': b[3]=P.BR; b[0]=0

        if piece==P.WK: nb.castle_rights['wk']=False; nb.castle_rights['wq']=False
        if piece==P.BK: nb.castle_rights['bk']=False; nb.castle_rights['bq']=False
        if m['from'] in (56,) or m['to']==56: nb.castle_rights['wq']=False
        if m['from'] in (63,) or m['to']==63: nb.castle_rights['wk']=False
        if m['from'] in (0,) or m['to']==0: nb.castle_rights['bq']=False
        if m['from'] in (7,) or m['to']==7: nb.castle_rights['bk']=False

        nb.en_passant = -1
        if piece==P.WP and m['from']-m['to']==16: nb.en_passant=m['from']-8
        if piece==P.BP and m['to']-m['from']==16: nb.en_passant=m['from']+8

        nb.white_to_move = not self.white_to_move
        return nb, captured

    def get_legal_moves(self):
        pseudo = self.gen_moves()
        legal = []
        for m in pseudo:
            nb, _ = self.make_move(m)
            ks = nb.find_king(self.white_to_move)
            if ks >= 0 and not nb.is_attacked(ks, not self.white_to_move):
                legal.append(m)
        return legal