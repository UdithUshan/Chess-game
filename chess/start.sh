#!/bin/bash
echo "=========================================="
echo "  Chess Professional Edition"
echo "  Starting Python AI Server..."
echo "=========================================="
echo ""
cd python
pip3 install flask flask-cors > /dev/null 2>&1
echo "Server: http://localhost:5000"
echo ""
python3 server.py