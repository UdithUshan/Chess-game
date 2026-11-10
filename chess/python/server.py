from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chess_engine import ChessBoard
from ai_engine import ChessAI

app = Flask(__name__)
CORS(app)

ai = ChessAI()

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

@app.route('/')
def index():
    return send_file(os.path.join(ROOT, 'index.html'))

@app.route('/css/<path:f>')
def css(f):
    return send_from_directory(os.path.join(ROOT, 'css'), f)

@app.route('/js/<path:f>')
def js(f):
    return send_from_directory(os.path.join(ROOT, 'js'), f)

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'engine': 'Python Chess AI v1.0'})

@app.route('/api/move', methods=['POST'])
def get_move():
    try:
        data = request.json
        board = ChessBoard()
        board.board = list(data['board'])
        board.white_to_move = data['white_to_move']
        board.castle_rights = dict(data['castle_rights'])
        board.en_passant = data['en_passant']
        difficulty = data.get('difficulty', 3)

        start = time.time()
        result = ai.get_best_move(board, difficulty)
        elapsed = time.time() - start

        if result and result.get('move'):
            return jsonify({
                'from': result['move']['from'],
                'to': result['move']['to'],
                'promo': result['move'].get('promo'),
                'castle': result['move'].get('castle'),
                'score': result.get('score', 0),
                'depth': result.get('depth', 0),
                'nodes': result.get('nodes', 0),
                'time': round(elapsed, 3)
            })
        return jsonify({'error': 'No move found'}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print()
    print("=" * 50)
    print("  CHESS AI SERVER")
    print("  Open http://localhost:5000 in your browser")
    print("=" * 50)
    print()
    app.run(host='0.0.0.0', port=5000, debug=False)