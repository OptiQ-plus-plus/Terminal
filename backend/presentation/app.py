import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Dodanie katalogu głównego do ścieżki importu
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from domain.services.stock_service import StockService
from application.stock_application_service import StockApplicationService
from infrastructure.apis.alpha_vantage_api import AlphaVantageAPI
from infrastructure.repositories.alpha_vantage_repository import AlphaVantageRepository

load_dotenv()

# Wersja backendu
BACKEND_VERSION = "1.0.0"
API_VERSION = "v1"

# Inicjalizacja komponentów aplikacji
api = AlphaVantageAPI()
repository = AlphaVantageRepository(api)
domain_service = StockService(repository)
application_service = StockApplicationService(domain_service)

app = Flask(__name__)
CORS(app)

# Log informacyjny o trybie watchera
print("=" * 50)
print(f"Backend StockCharts v{BACKEND_VERSION} uruchomiony")
print("Tryb WATCHER aktywny - zmiany plików będą automatycznie wykrywane")
print("=" * 50)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint do sprawdzania stanu API."""
    return jsonify({
        "status": "ok",
        "message": "API działa poprawnie"
    })

@app.route('/api/info', methods=['GET'])
def api_info():
    """Endpoint zwracający informacje o API."""
    return jsonify({
        "name": "StockCharts Backend",
        "version": BACKEND_VERSION,
        "api_version": API_VERSION,
        "environment": os.environ.get("FLASK_ENV", "production"),
        "alpha_vantage_api": "Aktywne" if os.environ.get("ALPHA_VANTAGE_API_KEY") else "Brak klucza API",
        "watch_mode": "Aktywny"
    })

@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    """Endpoint do wyszukiwania instrumentów giełdowych."""
    query = request.args.get('query', '')
    
    if not query:
        return jsonify({
            "status": "error",
            "message": "Brak parametru query"
        }), 400
    
    try:
        results = application_service.search_stocks(query)
        return jsonify({
            "status": "success",
            "data": results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/stocks/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """Endpoint do pobierania danych giełdowych dla określonego symbolu."""
    # Pobranie parametrów zapytania
    interval = request.args.get('interval', 'daily')
    period = request.args.get('period')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    try:
        data = application_service.get_stock_data(
            symbol,
            interval=interval,
            period=period,
            start_date=start_date,
            end_date=end_date
        )
        return jsonify({
            "status": "success",
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 