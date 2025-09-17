"""
Testes para o módulo de otimização de imagens
"""

import pytest
import json
import io
from PIL import Image
from unittest.mock import Mock, patch
from app import create_app
from image_optimizer import ImageOptimizer
from config import ImageOptimizerConfig

@pytest.fixture
def app():
    """Fixture da aplicação Flask para testes"""
    app = create_app('development')
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    """Cliente de teste"""
    return app.test_client()

@pytest.fixture
def sample_image_data():
    """Cria dados de imagem de exemplo"""
    img = Image.new('RGB', (800, 600), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=95)
    return buffer.getvalue()

@pytest.fixture
def mock_redis():
    """Mock do cliente Redis"""
    redis_mock = Mock()
    redis_mock.get.return_value = None
    redis_mock.setex.return_value = True
    redis_mock.ping.return_value = True
    return redis_mock

class TestImageOptimizer:
    """Testes da classe ImageOptimizer"""
    
    def test_init_with_default_config(self):
        """Testa inicialização com configuração padrão"""
        optimizer = ImageOptimizer()
        assert optimizer.max_width == 1920
        assert optimizer.max_height == 1080
        assert optimizer.webp_quality == 85

    def test_init_with_custom_config(self):
        """Testa inicialização com configuração personalizada"""
        config = {'max_width': 1280, 'webp_quality': 75}
        optimizer = ImageOptimizer(config=config)
        assert optimizer.max_width == 1280
        assert optimizer.webp_quality == 75

    def test_is_generic_telegram_image(self):
        """Testa detecção de imagens genéricas do Telegram"""
        optimizer = ImageOptimizer()
        
        # URLs genéricas
        assert optimizer._is_generic_telegram_image('https://telesco.pe/file/123.jpg')
        assert optimizer._is_generic_telegram_image('https://t.me/i/userpic/123')
        assert optimizer._is_generic_telegram_image('https://ui-avatars.com/api/?name=Test')
        
        # URLs válidas
        assert not optimizer._is_generic_telegram_image('https://example.com/real-image.jpg')
        assert not optimizer._is_generic_telegram_image('https://cdn.example.com/photo.png')

    def test_generate_image_hash(self, sample_image_data):
        """Testa geração de hash da imagem"""
        optimizer = ImageOptimizer()
        hash1 = optimizer._generate_image_hash(sample_image_data)
        hash2 = optimizer._generate_image_hash(sample_image_data)
        
        assert hash1 == hash2  # Mesmo dados = mesmo hash
        assert len(hash1) == 16  # Hash truncado para 16 caracteres
        assert isinstance(hash1, str)

    @patch('requests.get')
    def test_download_image_success(self, mock_get, sample_image_data):
        """Testa download bem-sucedido de imagem"""
        # Mock da resposta HTTP
        mock_response = Mock()
        mock_response.content = sample_image_data
        mock_response.headers = {'content-type': 'image/jpeg'}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        optimizer = ImageOptimizer()
        data, content_type = optimizer._download_image('https://example.com/test.jpg')
        
        assert data == sample_image_data
        assert content_type == 'image/jpeg'

    @patch('requests.get')
    def test_download_image_failure(self, mock_get):
        """Testa falha no download de imagem"""
        mock_get.side_effect = Exception("Network error")
        
        optimizer = ImageOptimizer()
        
        with pytest.raises(Exception):
            optimizer._download_image('https://example.com/test.jpg')

    def test_optimize_image_webp(self, sample_image_data):
        """Testa otimização para WebP"""
        optimizer = ImageOptimizer()
        optimized_data, metadata = optimizer._optimize_image(sample_image_data, 'WEBP')
        
        assert len(optimized_data) > 0
        assert len(optimized_data) < len(sample_image_data)  # Deve ser menor
        assert metadata['new_format'] == 'WEBP'
        assert metadata['size_reduction_percent'] > 0

    def test_cache_operations(self, mock_redis):
        """Testa operações de cache"""
        optimizer = ImageOptimizer(redis_client=mock_redis)
        
        # Teste de salvamento
        cache_key = "test_key"
        data = {"test": "data"}
        optimizer._save_to_cache(cache_key, data)
        
        mock_redis.setex.assert_called_once()
        
        # Teste de recuperação
        mock_redis.get.return_value = json.dumps(data)
        cached_data = optimizer._get_from_cache(cache_key)
        
        assert cached_data == data


class TestFlaskEndpoints:
    """Testes dos endpoints Flask"""
    
    def test_index_endpoint(self, client):
        """Testa endpoint raiz"""
        response = client.get('/')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['service'] == 'TopGrupos Image Optimizer'
        assert 'endpoints' in data

    def test_optimize_image_missing_url(self, client):
        """Testa endpoint com URL faltando"""
        response = client.post('/optimize-image', 
                             json={},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['success']
        assert 'image_url' in data['error']

    def test_optimize_image_invalid_format(self, client):
        """Testa endpoint com formato inválido"""
        response = client.post('/optimize-image',
                             json={
                                 'image_url': 'https://example.com/test.jpg',
                                 'format': 'INVALID'
                             },
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['success']
        assert 'Formato inválido' in data['error']

    def test_optimize_image_invalid_quality(self, client):
        """Testa endpoint com qualidade inválida"""
        response = client.post('/optimize-image',
                             json={
                                 'image_url': 'https://example.com/test.jpg',
                                 'quality': 150  # Inválido
                             },
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['success']
        assert 'Qualidade deve ser' in data['error']

    def test_batch_optimize_empty_list(self, client):
        """Testa lote com lista vazia"""
        response = client.post('/batch-optimize',
                             json={'image_urls': []},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert not data['success']

    def test_health_endpoint(self, client):
        """Testa health check"""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'redis_status' in data
        assert 'optimizer_config' in data

    def test_cache_stats_endpoint(self, client):
        """Testa endpoint de estatísticas"""
        response = client.get('/cache-stats')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'cache_enabled' in data

    def test_404_handler(self, client):
        """Testa handler de 404"""
        response = client.get('/nonexistent')
        assert response.status_code == 404
        
        data = json.loads(response.data)
        assert not data['success']
        assert 'available_endpoints' in data


class TestConfiguration:
    """Testes de configuração"""
    
    def test_default_config(self):
        """Testa configuração padrão"""
        config = ImageOptimizerConfig()
        config_dict = config.to_dict()
        
        assert config_dict['max_width'] == 1920
        assert config_dict['max_height'] == 1080
        assert config_dict['webp_quality'] == 85

    def test_config_validation(self):
        """Testa validação de configuração"""
        config = ImageOptimizerConfig()
        validation = config.validate()
        
        assert validation['valid'] == True
        assert len(validation['issues']) == 0


# Testes de integração
class TestIntegration:
    """Testes de integração completos"""
    
    @patch('image_optimizer.ImageOptimizer._download_image')
    @patch('image_optimizer.ImageOptimizer._is_generic_telegram_image')
    def test_full_optimization_flow(self, mock_generic, mock_download, client, sample_image_data):
        """Testa fluxo completo de otimização"""
        # Setup mocks
        mock_generic.return_value = False
        mock_download.return_value = (sample_image_data, 'image/jpeg')
        
        # Fazer requisição
        response = client.post('/optimize-image',
                             json={
                                 'image_url': 'https://example.com/test.jpg',
                                 'format': 'WEBP',
                                 'quality': 85
                             },
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] == True
        assert 'optimized_url_or_base64' in data
        assert 'size_reduction_percent' in data
        assert data['from_cache'] == False


if __name__ == '__main__':
    pytest.main([__file__, '-v'])