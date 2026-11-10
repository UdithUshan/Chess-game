import time, random
from chess_engine import ChessBoard, Piece as P

PST = {}
PST[P.WP]=[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,27,27,10,5,5,0,0,0,25,25,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-25,-25,10,10,5,0,0,0,0,0,0,0,0]
PST[P.WN]=[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50]
PST[P.WB]=[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20]
PST[P.WR]=[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0]
PST[P.WQ]=[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20]
PST[P.WK]=[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]

def flip(t):
    f=[]
    for r in range(7,-1,-1):
        for c in range(8): f.append(t[r*8+c])
    return f

PST[P.BP]=flip(PST[P.WP]); PST[P.BN]=flip(PST[P.WN]); PST[P.BB]=flip(PST[P.WB])
PST[P.BR]=flip(PST[P.WR]); PST[P.BQ]=flip(PST[P.WQ]); PST[P.BK]=flip(PST[P.WK])

VALS={P.WP:100,P.WN:320,P.WB:330,P.WR:500,P.WQ:900,P.WK:20000,
      P.BP:100,P.BN:320,P.BB:330,P.BR:500,P.BQ:900,P.BK:20000}

BOOK = {
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR': [{'from':52,'to':36},{'from':51,'to':35},{'from':62,'to':45}],
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': [{'from':12,'to':28},{'from':10,'to':26},{'from':6,'to':21}],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': [{'from':11,'to':27},{'from':6,'to':21}],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': [{'from':62,'to':45},{'from':57,'to':42}],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': [{'from':1,'to':18},{'from':6,'to':21}],
}

def board_fen(b):
    fen = ''
    chars = {P.WP:'P',P.WN:'N',P.WB:'B',P.WR:'R',P.WQ:'Q',P.WK:'K',
             P.BP:'p',P.BN:'n',P.BB:'b',P.BR:'r',P.BQ:'q',P.BK:'k'}
    for r in range(8):
        empty = 0
        for c in range(8):
            p = b[r*8+c]
            if p == 0: empty += 1
            else:
                if empty > 0: fen += str(empty); empty = 0
                fen += chars.get(p, '?')
        if empty > 0: fen += str(empty)
        if r < 7: fen += '/'
    return fen

class ChessAI:
    def __init__(self):
        self.killers = {}
        self.history = {}
        self.start = 0
        self.max_time = 3.0
        self.aborted = False
        self.nodes = 0

    def evaluate(self, board):
        score = 0
        for s in range(64):
            p = board.board[s]
            if p == 0: continue
            v = VALS.get(p, 0)
            pst = PST.get(p, [0]*64)[s]
            if P.is_white(p): score += v + pst
            else: score -= v + pst
        return score

    def order_moves(self, board, moves, ply):
        def score(m):
            s = 0
            if board.board[m['to']] != 0:
                s += 10000 + VALS.get(board.board[m['to']], 0) * 10 - VALS.get(board.board[m['from']], 0)
            if 'promo' in m: s += 9000
            k = self.killers.get(ply)
            if k and k.get('from') == m['from'] and k.get('to') == m['to']: s += 8000
            key = m['from'] * 64 + m['to']
            s += self.history.get(key, 0)
            if m['to'] in (27, 28, 35, 36): s += 50
            return s
        return sorted(moves, key=score, reverse=True)

    def quiesce(self, board, alpha, beta, white):
        self.nodes += 1
        if time.time() - self.start > self.max_time:
            self.aborted = True; return 0

        stand = self.evaluate(board)
        if not white: stand = -stand
        if stand >= beta: return beta
        if stand > alpha: alpha = stand

        moves = board.get_legal_moves()
        for m in moves:
            if board.board[m['to']] == 0 and 'promo' not in m: continue
            nb, _ = board.make_move(m)
            score = -self.quiesce(nb, -beta, -alpha, not white)
            if self.aborted: return 0
            if score >= beta: return beta
            if score > alpha: alpha = score
        return alpha

    def negamax(self, board, depth, alpha, beta, white, ply):
        self.nodes += 1
        if self.aborted or time.time() - self.start > self.max_time:
            self.aborted = True; return {'score': 0}

        if depth == 0:
            return {'score': self.quiesce(board, alpha, beta, white)}

        moves = board.get_legal_moves()
        if len(moves) == 0:
            if board.in_check(): return {'score': -20000 + ply}
            return {'score': 0}

        moves = self.order_moves(board, moves, ply)
        best = moves[0]; best_score = -999999

        for i, m in enumerate(moves):
            nb, _ = board.make_move(m)

            if i >= 4 and depth >= 3 and board.board[m['to']] == 0 and 'promo' not in m and not nb.in_check():
                res = self.negamax(nb, depth-2, -beta, -alpha, not white, ply+1)
                score = -res['score']
                if score > alpha:
                    res = self.negamax(nb, depth-1, -beta, -alpha, not white, ply+1)
                    score = -res['score']
            else:
                res = self.negamax(nb, depth-1, -beta, -alpha, not white, ply+1)
                score = -res['score']

            if self.aborted: return {'score': 0}
            if score > best_score: best_score = score; best = m
            alpha = max(alpha, score)
            if alpha >= beta:
                if board.board[m['to']] == 0:
                    self.killers[ply] = m
                    key = m['from']*64+m['to']
                    self.history[key] = self.history.get(key, 0) + depth*depth
                break

        return {'score': best_score, 'move': best}

    def get_best_move(self, board, difficulty=3):
        fen = board_fen(board.board)
        book_moves = BOOK.get(fen)
        if book_moves:
            m = random.choice(book_moves)
            legal = board.get_legal_moves()
            for lm in legal:
                if lm['from'] == m['from'] and lm['to'] == m['to']:
                    return {'move': lm, 'score': 0, 'depth': 0, 'nodes': 0}

        depth_map = {1:3, 2:4, 3:5, 4:6, 5:8}
        time_map = {1:0.5, 2:1.0, 3:2.0, 4:3.0, 5:5.0}

        max_depth = depth_map.get(difficulty, 5)
        self.max_time = time_map.get(difficulty, 2.0)
        self.start = time.time()
        self.aborted = False
        self.nodes = 0
        self.killers = {}
        self.history = {}

        best_result = None

        for depth in range(1, max_depth+1):
            if self.aborted: break
            result = self.negamax(board, depth, -999999, 999999, board.white_to_move, 0)
            if not self.aborted and result.get('move'):
                best_result = {
                    'move': result['move'],
                    'score': result['score'],
                    'depth': depth,
                    'nodes': self.nodes
                }
            if time.time() - self.start > self.max_time * 0.75: break

        return best_result