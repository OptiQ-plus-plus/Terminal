import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

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
# Konfiguracja CORS, aby umożliwić dostęp z frontendu
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:4200", "http://frontend:4200", "http://127.0.0.1:4200", "http://172.18.0.3:4200"]}}, supports_credentials=True)

# Log informacyjny o trybie watchera
print("=" * 50)
print(f"Backend OptiQ Terminal v{BACKEND_VERSION} uruchomiony")
print(f"API dostępne pod adresem: http://localhost:5050/api")
print("Tryb WATCHER aktywny - zmiany plików będą automatycznie wykrywane")
print("=" * 50)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint do sprawdzania stanu API."""
    return jsonify({
        "status": "ok",
        "message": "API działa poprawnie"
    })

@app.route('/api/status', methods=['GET'])
def api_info():
    """Endpoint zwracający informacje o API."""
    return jsonify({
        "status": "success",
        "data": {
            "name": "OptiQ Terminal Backend",
            "version": BACKEND_VERSION,
            "api_version": API_VERSION,
            "environment": os.environ.get("FLASK_ENV", "production"),
            "alpha_vantage_api": "Aktywne" if os.environ.get("ALPHA_VANTAGE_API_KEY") else "Brak klucza API",
            "watch_mode": "Aktywny"
        }
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
    
    print(f"[DEBUG] Pobieranie danych dla symbolu: {symbol}, interval: {interval}, period: {period}")
    
    try:
        data = application_service.get_stock_data(
            symbol,
            interval=interval,
            period=period,
            start_date=start_date,
            end_date=end_date
        )
        print(f"[DEBUG] Pobrano dane dla symbolu {symbol} - liczba punktów: {len(data.get('prices', []))}")
        return jsonify({
            "status": "success",
            "data": data
        })
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"[ERROR] Błąd podczas pobierania danych dla symbolu {symbol}: {str(e)}")
        print(f"[ERROR] Szczegóły błędu: {error_traceback}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "details": error_traceback
        }), 500

# Nowe endpointy dla opcji

@app.route('/api/options/<symbol>/expirations', methods=['GET'])
def get_option_expiration_dates(symbol):
    """
    Endpoint do pobierania dostępnych dat wygaśnięcia dla opcji.
    W produkcji powinien pobierać rzeczywiste daty z zewnętrznego API.
    """
    # Symulacja dat wygaśnięcia dla celów demonstracyjnych
    # W rzeczywistości te dane powinny pochodzić z serwisu domenowego
    try:
        # Symulujemy 6 dat wygaśnięcia zaczynając od przyszłego miesiąca
        dates = []
        current_date = datetime.now().replace(day=20)
        
        # Sprawdź, czy symbol jest jednym z obsługiwanych
        if symbol.upper() not in ['IBM', 'INTC', 'TSLA']:
            return jsonify({
                "status": "error",
                "message": f"Brak obsługi opcji dla symbolu {symbol}. Obsługiwane symbole: IBM, INTC, TSLA"
            }), 400
        
        for i in range(1, 7):
            next_date = current_date + timedelta(days=30*i)
            # Standaryzowany format daty wygaśnięcia opcji (trzeci piątek miesiąca)
            # Uproszczona wersja dla celów demonstracyjnych
            dates.append(next_date.strftime("%Y-%m-%d"))
        
        return jsonify({
            "status": "success",
            "data": dates
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/options/<symbol>', methods=['GET'])
def get_options_data(symbol):
    """
    Endpoint do pobierania danych opcji dla określonego symbolu.
    W produkcji powinien pobierać rzeczywiste dane z zewnętrznego API.
    """
    try:
        # Pobranie parametrów zapytania
        expiration_date = request.args.get('expirationDate')
        option_type = request.args.get('optionType')
        min_strike = request.args.get('minStrike')
        max_strike = request.args.get('maxStrike')
        
        # Sprawdź, czy symbol jest jednym z obsługiwanych
        if symbol.upper() not in ['IBM', 'INTC', 'TSLA']:
            return jsonify({
                "status": "error",
                "message": f"Brak obsługi opcji dla symbolu {symbol}. Obsługiwane symbole: IBM, INTC, TSLA"
            }), 400
        
        # Symulacja danych opcji
        # W rzeczywistości te dane powinny pochodzić z serwisu domenowego
        
        # Generuj dane opcji w zależności od symbolu
        stock_prices = {
            'IBM': 142.25,
            'INTC': 38.46,
            'TSLA': 248.50
        }
        
        current_price = stock_prices.get(symbol.upper(), 100.0)
        options = []
        
        # Generuj opcje dla różnych cen wykonania
        strike_range = range(int(current_price * 0.7), int(current_price * 1.3), int(current_price * 0.05))
        
        # Filtruj zakres strajków jeśli podano parametry
        if min_strike:
            strike_range = [s for s in strike_range if s >= float(min_strike)]
        if max_strike:
            strike_range = [s for s in strike_range if s <= float(max_strike)]
        
        # Filtruj po typie opcji
        option_types = ['call', 'put']
        if option_type and option_type.lower() in option_types:
            option_types = [option_type.lower()]
        
        for strike in strike_range:
            for opt_type in option_types:
                # Oblicz dane bazowe opcji
                in_the_money = (opt_type == 'call' and current_price > strike) or (opt_type == 'put' and current_price < strike)
                moneyness = abs(current_price - strike) / current_price
                
                # Oblicz IV na podstawie moneyness (uproszczone)
                iv = 0.25 + 0.15 * moneyness
                
                # Random dla symulacji różnorodności danych
                random_factor = random.uniform(0.9, 1.1)
                
                # Cena bazowa dla opcji
                if opt_type == 'call':
                    price = max(0, current_price - strike) + (iv * strike * 0.1)
                else:
                    price = max(0, strike - current_price) + (iv * strike * 0.1)
                
                price = round(price * random_factor, 2)
                
                # Podstawowe parametry opcji
                option = {
                    "symbol": f"{symbol}{opt_type[0].upper()}{strike}",
                    "underlyingSymbol": symbol.upper(),
                    "expirationDate": expiration_date or "2025-01-17",
                    "strikePrice": strike,
                    "optionType": opt_type,
                    "lastPrice": price,
                    "bid": round(price * 0.95, 2),
                    "ask": round(price * 1.05, 2),
                    "change": round(random.uniform(-2, 2), 2),
                    "percentChange": round(random.uniform(-5, 5), 2),
                    "volume": int(random.uniform(100, 5000)),
                    "openInterest": int(random.uniform(500, 10000)),
                    "impliedVolatility": round(iv * 100, 2),
                    "inTheMoney": in_the_money,
                    "lastTradeDate": (datetime.now() - timedelta(hours=random.randint(1, 24))).strftime("%Y-%m-%d %H:%M:%S"),
                    # Grecy dla opcji
                    "greeks": calculate_option_greeks(current_price, strike, 0.02, iv, 30/365, opt_type)
                }
                
                options.append(option)
        
        return jsonify({
            "status": "success",
            "data": options
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/quantum/status', methods=['GET'])
def check_quantum_status():
    """Endpoint sprawdzający status połączenia z komputerem kwantowym."""
    return jsonify({
        "status": "success",
        "data": {
            "status": "offline",
            "available": False,
            "message": "Integracja z komputerem kwantowym w trakcie implementacji"
        }
    })

@app.route('/api/prediction/<symbol>', methods=['POST'])
def generate_prediction(symbol):
    """
    Endpoint do generowania predykcji rozkładu prawdopodobieństwa dla opcji.
    W produkcji powinien używać rzeczywistych modeli predykcyjnych.
    """
    try:
        # Pobranie parametrów z ciała zapytania
        request_data = request.get_json()
        
        # Symulacja wygenerowanego rozkładu prawdopodobieństwa
        # W rzeczywistości te dane powinny pochodzić z modelu predykcyjnego
        
        # Baza do symulacji
        expected_value = float(request_data.get('strikePrice', 100))
        
        distribution = {
            "expectedValue": expected_value,
            "variance": 25.0,
            "skewness": 0.15,
            "kurtosis": 3.2,
            "confidenceIntervals": [
                {
                    "lowerBound": expected_value - 10,
                    "upperBound": expected_value + 10,
                    "confidence": 0.68
                },
                {
                    "lowerBound": expected_value - 20,
                    "upperBound": expected_value + 20,
                    "confidence": 0.95
                },
                {
                    "lowerBound": expected_value - 30,
                    "upperBound": expected_value + 30,
                    "confidence": 0.99
                }
            ],
            "discretePoints": generate_discrete_distribution(expected_value, 25.0, 10)
        }
        
        return jsonify({
            "status": "success",
            "data": distribution
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Funkcje pomocnicze do obliczania Greków i rozkładów prawdopodobieństwa

def calculate_option_greeks(spot, strike, rate, volatility, time_to_expiry, option_type):
    """
    Funkcja obliczająca przybliżone wartości Greków dla opcji.
    W produkcji powinny być używane dokładniejsze modele.
    
    Args:
        spot: Bieżąca cena instrumentu bazowego
        strike: Cena wykonania opcji
        rate: Stopa procentowa
        volatility: Zmienność implikowana (w postaci dziesiętnej, np. 0.2 dla 20%)
        time_to_expiry: Czas do wygaśnięcia opcji (w latach)
        option_type: Typ opcji ('call' lub 'put')
        
    Returns:
        Słownik z wartościami Greków
    """
    # Przybliżone wartości oparte na wzorach dla modelu Black-Scholesa
    # W rzeczywistym systemie należy użyć bibliotek finansowych z dokładnymi obliczeniami
    
    # Moneyness (dla uproszczenia obliczeń)
    moneyness = spot / strike
    
    # Delta
    if option_type == 'call':
        delta = 0.5 + 0.5 * (moneyness - 1) / (volatility * (time_to_expiry ** 0.5))
        delta = max(0, min(1, delta))
    else:
        delta = -0.5 - 0.5 * (moneyness - 1) / (volatility * (time_to_expiry ** 0.5))
        delta = max(-1, min(0, delta))
    
    # Gamma (zbliżona dla call i put)
    gamma = 0.4 * ((volatility * (time_to_expiry ** 0.5)) ** -1) * moneyness ** (-2)
    gamma = min(1, gamma)
    
    # Theta (przybliżenie)
    theta = -0.5 * spot * volatility * (time_to_expiry ** -0.5) / 365
    if option_type == 'put':
        theta = theta + (rate * strike * (time_to_expiry ** -1)) / 365
    else:
        theta = theta - (rate * strike * (time_to_expiry ** -1)) / 365
    
    # Vega
    vega = 0.4 * spot * (time_to_expiry ** 0.5) * 0.01
    
    # Rho
    if option_type == 'call':
        rho = 0.5 * strike * time_to_expiry * 0.01
    else:
        rho = -0.5 * strike * time_to_expiry * 0.01
    
    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 4),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "rho": round(rho, 4)
    }

def generate_discrete_distribution(mean, variance, num_points):
    """
    Generuje dyskretny rozkład prawdopodobieństwa.
    
    Args:
        mean: Średnia rozkładu
        variance: Wariancja rozkładu
        num_points: Liczba punktów do wygenerowania
        
    Returns:
        Lista punktów (wartość, prawdopodobieństwo)
    """
    points = []
    std_dev = variance ** 0.5
    
    total_prob = 0
    for i in range(num_points):
        # Generuj punkty równomiernie rozmieszczone w zakresie ±3 odchyleń standardowych
        value = mean + (i - num_points / 2) * (6 * std_dev / num_points)
        
        # Przybliżenie rozkładu normalnego
        prob = (1 / (std_dev * (2 * 3.14159) ** 0.5)) * (2.71828 ** (-(value - mean) ** 2 / (2 * variance)))
        
        points.append({
            "value": round(value, 2),
            "probability": round(prob, 4)
        })
        total_prob += prob
    
    # Normalizacja prawdopodobieństw
    for point in points:
        point["probability"] = round(point["probability"] / total_prob, 4)
    
    return points

# Funkcje do obliczania wskaźników technicznych
def calculate_sma(prices, period):
    """Oblicza SMA (Simple Moving Average) dla danych cenowych."""
    if len(prices) < period:
        return []
    
    result = []
    for i in range(period - 1, len(prices)):
        sum_prices = sum(float(prices[j]['close']) for j in range(i - period + 1, i + 1))
        avg = sum_prices / period
        timestamp = prices[i]['timestamp']
        result.append({"timestamp": timestamp, "value": avg})
    
    return result

def calculate_ema(prices, period):
    """Oblicza EMA (Exponential Moving Average) dla danych cenowych."""
    if len(prices) < period:
        return []
    
    # Początek z SMA
    sma = sum(float(prices[i]['close']) for i in range(period)) / period
    result = [{"timestamp": prices[period-1]['timestamp'], "value": sma}]
    
    # Mnożnik dla EMA
    multiplier = 2 / (period + 1)
    
    # Obliczenie EMA dla pozostałych dni
    ema = sma
    for i in range(period, len(prices)):
        ema = (float(prices[i]['close']) - ema) * multiplier + ema
        result.append({"timestamp": prices[i]['timestamp'], "value": ema})
    
    return result

def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """Oblicza MACD (Moving Average Convergence Divergence) dla danych cenowych."""
    if len(prices) < slow_period + signal_period:
        return {"macdLine": [], "signalLine": [], "histogram": []}
    
    # Oblicz EMA dla szybkiego i wolnego okresu
    fast_ema = calculate_ema(prices, fast_period)
    slow_ema = calculate_ema(prices, slow_period)
    
    # Wyrównaj długości (EMA wolnego okresu jest krótsza)
    start_idx = slow_period - fast_period
    fast_ema = fast_ema[start_idx:]
    
    # Oblicz linię MACD (różnica między szybkim i wolnym EMA)
    macd_line = []
    for i in range(len(slow_ema)):
        macd_value = fast_ema[i]['value'] - slow_ema[i]['value']
        macd_line.append({"timestamp": slow_ema[i]['timestamp'], "value": macd_value})
    
    # Oblicz linię sygnału (EMA linii MACD)
    signal_line = []
    if len(macd_line) >= signal_period:
        # Początek z SMA
        signal_sma = sum(macd_line[i]['value'] for i in range(signal_period)) / signal_period
        signal_line.append({"timestamp": macd_line[signal_period-1]['timestamp'], "value": signal_sma})
        
        # Mnożnik dla EMA
        multiplier = 2 / (signal_period + 1)
        
        # Obliczenie EMA dla pozostałych dni
        signal_ema = signal_sma
        for i in range(signal_period, len(macd_line)):
            signal_ema = (macd_line[i]['value'] - signal_ema) * multiplier + signal_ema
            signal_line.append({"timestamp": macd_line[i]['timestamp'], "value": signal_ema})
    
    # Oblicz histogram (różnica między linią MACD i linią sygnału)
    histogram = []
    for i in range(len(signal_line)):
        idx = i + signal_period
        hist_value = macd_line[idx]['value'] - signal_line[i]['value']
        histogram.append({"timestamp": macd_line[idx]['timestamp'], "value": hist_value})
    
    # Dopasuj długości danych dla frontendu
    macd_line = macd_line[signal_period:]
    
    return {
        "macdLine": macd_line,
        "signalLine": signal_line,
        "histogram": histogram
    }

def calculate_rsi(prices, period=14):
    """Oblicza RSI (Relative Strength Index) dla danych cenowych."""
    if len(prices) <= period:
        return []
    
    result = []
    
    # Obliczanie zmian cen
    changes = []
    for i in range(1, len(prices)):
        changes.append(float(prices[i]['close']) - float(prices[i-1]['close']))
    
    # Obliczanie początkowego RSI
    gains = [max(0, change) for change in changes[:period]]
    losses = [max(0, -change) for change in changes[:period]]
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        result.append({"timestamp": prices[period]['timestamp'], "value": 100})
    else:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        result.append({"timestamp": prices[period]['timestamp'], "value": rsi})
    
    # Obliczanie RSI dla pozostałych dni
    for i in range(period + 1, len(prices)):
        change = float(prices[i]['close']) - float(prices[i-1]['close'])
        gain = max(0, change)
        loss = max(0, -change)
        
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        result.append({"timestamp": prices[i]['timestamp'], "value": rsi})
    
    return result

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Oblicza Wstęgi Bollingera dla danych cenowych."""
    if len(prices) < period:
        return {"upperBand": [], "middleBand": [], "lowerBand": []}
    
    # Obliczanie SMA (środkowa wstęga)
    middle_band = calculate_sma(prices, period)
    
    # Obliczanie górnej i dolnej wstęgi
    upper_band = []
    lower_band = []
    
    for i in range(len(middle_band)):
        idx = i + period - 1
        # Obliczanie odchylenia standardowego
        variance = sum((float(prices[j]['close']) - middle_band[i]['value'])**2 for j in range(idx - period + 1, idx + 1)) / period
        std = variance ** 0.5
        
        # Obliczanie górnej i dolnej wstęgi
        upper = middle_band[i]['value'] + (std_dev * std)
        lower = middle_band[i]['value'] - (std_dev * std)
        
        upper_band.append({"timestamp": middle_band[i]['timestamp'], "value": upper})
        lower_band.append({"timestamp": middle_band[i]['timestamp'], "value": lower})
    
    return {
        "upperBand": upper_band,
        "middleBand": middle_band,
        "lowerBand": lower_band
    }

@app.route('/api/indicators/<symbol>/<indicator>', methods=['GET'])
def get_technical_indicator(symbol, indicator):
    """
    Endpoint do pobierania danych wskaźników technicznych dla określonego symbolu.
    """
    try:
        # Pobierz najpierw dane akcji, aby móc obliczyć wskaźniki
        interval = request.args.get('interval', 'daily')
        period = request.args.get('period', '1y')
        
        # Dodatkowe parametry dla wskaźników
        params = {}
        for key in request.args:
            if key not in ['interval', 'period', 'startDate', 'endDate']:
                try:
                    params[key] = float(request.args.get(key))
                except ValueError:
                    params[key] = request.args.get(key)
        
        # Pozyskanie danych akcji
        stock_data = application_service.get_stock_data(
            symbol,
            interval=interval,
            period=period
        )
        
        if not stock_data or not stock_data['prices'] or len(stock_data['prices']) == 0:
            return jsonify({
                "status": "error",
                "message": f"Brak danych dla symbolu {symbol}"
            }), 404
        
        prices = stock_data['prices']
        result = None
        
        # Obliczanie wskaźników
        if indicator == 'sma':
            period = int(params.get('period', 14))
            result = calculate_sma(prices, period)
        elif indicator == 'ema':
            period = int(params.get('period', 14))
            result = calculate_ema(prices, period)
        elif indicator == 'macd':
            fast_period = int(params.get('fastPeriod', 12))
            slow_period = int(params.get('slowPeriod', 26))
            signal_period = int(params.get('signalPeriod', 9))
            result = calculate_macd(prices, fast_period, slow_period, signal_period)
        elif indicator == 'rsi':
            period = int(params.get('period', 14))
            result = calculate_rsi(prices, period)
        elif indicator == 'bb':
            period = int(params.get('period', 20))
            std_dev = float(params.get('stdDev', 2))
            result = calculate_bollinger_bands(prices, period, std_dev)
        else:
            return jsonify({
                "status": "error",
                "message": f"Nieznany wskaźnik: {indicator}"
            }), 400
        
        # Dodaj parametry użyte do obliczenia wskaźnika
        if isinstance(result, dict):
            result['params'] = params
        
        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 