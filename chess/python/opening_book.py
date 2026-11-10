from chess_engine import ChessBoard, Piece
import random


class OpeningBook:

    def __init__(self):
        self.book = self._build_book()

    def _board_fen(self, board: ChessBoard) -> str:
        fen = ''
        for r in range(8):
            empty = 0
            for c in range(8):
                p = board.board[r * 8 + c]
                if p == 0:
                    empty += 1
                else:
                    if empty > 0:
                        fen += str(empty)
                        empty = 0
                    chars = {1:'P',2:'N',3:'B',4:'R',5:'Q',6:'K',
                            7:'p',8:'n',9:'b',10:'r',11:'q',12:'k'}
                    fen += chars.get(p, '?')
            if empty > 0:
                fen += str(empty)
            if r < 7:
                fen += '/'
        return fen

    def _build_book(self) -> dict:
        return {
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR': [
                {'from': 52, 'to': 36},
                {'from': 51, 'to': 35},
                {'from': 62, 'to': 45},
                {'from': 54, 'to': 38},
            ],
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': [
                {'from': 12, 'to': 28},
                {'from': 10, 'to': 26},
                {'from': 12, 'to': 20},
                {'from': 6, 'to': 21},
                {'from': 11, 'to': 27},
            ],
            'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': [
                {'from': 11, 'to': 27},
                {'from': 6, 'to': 21},
                {'from': 12, 'to': 20},
            ],
            'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': [
                {'from': 62, 'to': 45},
                {'from': 61, 'to': 25},
                {'from': 57, 'to': 42},
                {'from': 53, 'to': 37},
            ],
            'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': [
                {'from': 1, 'to': 18},
                {'from': 6, 'to': 21},
                {'from': 11, 'to': 19},
            ],
            'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': [
                {'from': 62, 'to': 45},
                {'from': 57, 'to': 42},
                {'from': 51, 'to': 35},
            ],
            'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR': [
                {'from': 54, 'to': 38},
                {'from': 62, 'to': 45},
                {'from': 57, 'to': 42},
            ],
            'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR': [
                {'from': 54, 'to': 38},
                {'from': 62, 'to': 45},
                {'from': 49, 'to': 41},
            ],
            'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R': [
                {'from': 11, 'to': 27},
                {'from': 6, 'to': 21},
                {'from': 12, 'to': 20},
            ],
            'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR': [
                {'from': 12, 'to': 28},
                {'from': 6, 'to': 21},
                {'from': 10, 'to': 26},
            ],
            'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R': [
                {'from': 5, 'to': 26},
                {'from': 6, 'to': 21},
            ],
            'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R': [
                {'from': 8, 'to': 16},
                {'from': 6, 'to': 21},
                {'from': 11, 'to': 19},
            ],
            'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R': [
                {'from': 51, 'to': 35},
                {'from': 57, 'to': 42},
            ],
            'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR': [
                {'from': 12, 'to': 20},
                {'from': 11, 'to': 26},
                {'from': 10, 'to': 18}, 
            ],
        }

    def get_move(self, board: ChessBoard) -> dict:
        fen = self._board_fen(board)
        moves = self.book.get(fen)

        if moves:
            return random.choice(moves)

        return None