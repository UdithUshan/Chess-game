from chess_engine import ChessBoard, Piece


class EndgameTable:

    def __init__(self):
        self.patterns = self._build_patterns()

    def _build_patterns(self):
        return {
            'KQvK': {'result': 'win', 'technique': 'Push enemy king to edge'},
            'KRvK': {'result': 'win', 'technique': 'Push enemy king to edge'},
            'KBBvK': {'result': 'win', 'technique': 'Push enemy king to corner'},
            'KBNvK': {'result': 'win', 'technique': 'Push enemy king to correct corner'},
            'KPvK': {'result': 'depends', 'technique': 'Check if pawn can promote'},
            'KvK': {'result': 'draw', 'technique': 'Insufficient material'},
            'KBvK': {'result': 'draw', 'technique': 'Insufficient material'},
            'KNvK': {'result': 'draw', 'technique': 'Insufficient material'},
            'KNNvK': {'result': 'draw', 'technique': 'Cannot force mate'},
        }

    def classify_endgame(self, board: ChessBoard) -> dict:
        P = Piece
        white_pieces = {}
        black_pieces = {}

        piece_names = {
            P.WPAWN: 'P', P.WKNIGHT: 'N', P.WBISHOP: 'B',
            P.WROOK: 'R', P.WQUEEN: 'Q', P.WKING: 'K',
            P.BPAWN: 'P', P.BKNIGHT: 'N', P.BBISHOP: 'B',
            P.BROOK: 'R', P.BQUEEN: 'Q', P.BKING: 'K'
        }

        for sq in range(64):
            p = board.board[sq]
            if p == P.EMPTY:
                continue

            name = piece_names.get(p, '?')
            if P.is_white(p):
                white_pieces[name] = white_pieces.get(name, 0) + 1
            else:
                black_pieces[name] = black_pieces.get(name, 0) + 1

        return {
            'white': white_pieces,
            'black': black_pieces,
            'total_pieces': sum(white_pieces.values()) + sum(black_pieces.values()),
            'is_endgame': sum(white_pieces.values()) + sum(black_pieces.values()) <= 10
        }

    def is_insufficient_material(self, board: ChessBoard) -> bool:
        P = Piece
        white_pieces = []
        black_pieces = []

        for sq in range(64):
            p = board.board[sq]
            if p == P.EMPTY:
                continue
            if P.is_white(p) and p != P.WKING:
                white_pieces.append(p)
            elif P.is_black(p) and p != P.BKING:
                black_pieces.append(p)

        if len(white_pieces) == 0 and len(black_pieces) == 0:
            return True

        if len(white_pieces) == 0 and len(black_pieces) == 1:
            if black_pieces[0] in (P.BBISHOP, P.BKNIGHT):
                return True

        if len(black_pieces) == 0 and len(white_pieces) == 1:
            if white_pieces[0] in (P.WBISHOP, P.WKNIGHT):
                return True

        if len(white_pieces) == 0 and len(black_pieces) == 2:
            if all(p == P.BKNIGHT for p in black_pieces):
                return True

        if len(black_pieces) == 0 and len(white_pieces) == 2:
            if all(p == P.WKNIGHT for p in white_pieces):
                return True

        return False

    def evaluate_endgame(self, board: ChessBoard) -> int:
        P = Piece
        score = 0

        wk = board.find_king(True)
        bk = board.find_king(False)

        if wk >= 0:
            wkr, wkc = board.rc(wk)
            score += (3 - abs(3.5 - wkr)) * 10
            score += (3 - abs(3.5 - wkc)) * 10

        if bk >= 0:
            bkr, bkc = board.rc(bk)
            score -= (3 - abs(3.5 - bkr)) * 10
            score -= (3 - abs(3.5 - bkc)) * 10

        classification = self.classify_endgame(board)
        white_material = sum(P.VALUES.get(board.board[sq], 0) for sq in range(64) if P.is_white(board.board[sq]))
        black_material = sum(P.VALUES.get(board.board[sq], 0) for sq in range(64) if P.is_black(board.board[sq]))

        if white_material > black_material + 200:
            if bk >= 0:
                bkr, bkc = board.rc(bk)
                edge_dist = min(bkr, 7 - bkr, bkc, 7 - bkc)
                score += (3 - edge_dist) * 20

                if wk >= 0:
                    wkr, wkc = board.rc(wk)
                    king_dist = abs(wkr - bkr) + abs(wkc - bkc)
                    score += (14 - king_dist) * 5

        elif black_material > white_material + 200:
            if wk >= 0:
                wkr, wkc = board.rc(wk)
                edge_dist = min(wkr, 7 - wkr, wkc, 7 - wkc)
                score -= (3 - edge_dist) * 20

                if bk >= 0:
                    bkr, bkc = board.rc(bk)
                    king_dist = abs(wkr - bkr) + abs(wkc - bkc)
                    score -= (14 - king_dist) * 5

        for sq in range(64):
            if board.board[sq] == P.WPAWN:
                r, c = board.rc(sq)
                passed = True
                for check_r in range(r - 1, -1, -1):
                    for dc in [-1, 0, 1]:
                        if board.valid(check_r, c + dc):
                            if board.board[board.sq(check_r, c + dc)] == P.BPAWN:
                                passed = False
                                break
                    if not passed:
                        break
                if passed:
                    score += (6 - r) * 20

            elif board.board[sq] == P.BPAWN:
                r, c = board.rc(sq)
                passed = True
                for check_r in range(r + 1, 8):
                    for dc in [-1, 0, 1]:
                        if board.valid(check_r, c + dc):
                            if board.board[board.sq(check_r, c + dc)] == P.WPAWN:
                                passed = False
                                break
                    if not passed:
                        break
                if passed:
                    score -= (r - 1) * 20

        return score