"""
Aplicação Flask principal com endpoints de otimização de imagem
Integração com TopGrupos backend
"""

import os
import redis
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import logging
from typing import Dict, Any

from image_optimizer import ImageOptimizer, create_image_optimizer_app
from config import get_config, ImageOptimizerConfig
from utils import analyze_optimization_potential, get_image_info

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_name: str = None) -> Flask:
    """
    Factory function para criar aplicação Flask
    
    Args:
        config_name: Nome do ambiente (development/production)
        
    Returns:
        Flask: Aplicação configurada
    """
    app = Flask(__name__)
    CORS(app)  # Permitir CORS para integração com frontend
    
    # Carregar configurações
    config = get_config(config_name)
    
    # Configurar Redis/Upstash
    redis_client = None
    if config.REDIS_HOST:
        try:
            redis_client = redis.Redis(
                host=config.REDIS_HOST,
                port=config.REDIS_PORT,
                password=config.REDIS_PASSWORD,
                ssl=config.REDIS_SSL,
                decode_responses=False,  # Para dados binários
                socket_connect_timeout=10,
                socket_timeout=10,
                retry_on_timeout=True
            )
            
            # Testar conexão
            redis_client.ping()
            logger.info("✅ Conexão Redis/Upstash estabelecida")
            
        except Exception as e:
            logger.error(f"❌ Erro na conexão Redis: {e}")
            redis_client = None
    else:
        logger.warning("⚠️ Redis não configurado, cache desabilitado")
    
    # Criar otimizador
    optimizer = ImageOptimizer(redis_client, config.to_dict())
    
    @app.route('/', methods=['GET'])
    def index():
        """Página inicial da API"""
        return jsonify({
            'service': 'TopGrupos Image Optimizer',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'optimize_image': '/optimize-image [POST]',
                'batch_optimize': '/batch-optimize [POST]',
                'analyze_image': '/analyze-image [POST]',
                'cache_stats': '/cache-stats [GET]',
                'clear_cache': '/clear-cache [POST]',
                'health': '/health [GET]'
            },
            'timestamp': datetime.utcnow().isoformat()
        })

    @app.route('/optimize-image', methods=['POST'])
    def optimize_image():
        """
        Endpoint principal para otimização de imagem única
        
        POST /optimize-image
        {
            "image_url": "https://example.com/image.jpg",
            "format": "WEBP",           // opcional: WEBP, JPEG, AVIF, PNG
            "quality": 85,              // opcional: 1-100
            "is_thumbnail": false,      // opcional: true para thumbnails
            "return_base64": true,      // opcional: retornar base64 ou URL
            "max_width": 1920,          // opcional: largura máxima
            "max_height": 1080          // opcional: altura máxima
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'JSON inválido ou vazio'
                }), 400
            
            if 'image_url' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Campo image_url é obrigatório'
                }), 400
            
            image_url = data['image_url'].strip()
            if not image_url:
                return jsonify({
                    'success': False,
                    'error': 'image_url não pode estar vazio'
                }), 400
            
            # Opções de otimização com validação
            options = {}
            
            # Formato
            if 'format' in data:
                format_val = data['format'].upper()
                if format_val not in ['WEBP', 'JPEG', 'AVIF', 'PNG']:
                    return jsonify({
                        'success': False,
                        'error': 'Formato inválido. Use: WEBP, JPEG, AVIF, PNG'
                    }), 400
                options['format'] = format_val
            
            # Qualidade
            if 'quality' in data:
                quality = data['quality']
                if not isinstance(quality, int) or not 1 <= quality <= 100:
                    return jsonify({
                        'success': False,
                        'error': 'Qualidade deve ser um número entre 1 e 100'
                    }), 400
                options['quality'] = quality
            
            # Outras opções
            if 'is_thumbnail' in data:
                options['is_thumbnail'] = bool(data['is_thumbnail'])
            
            if 'return_base64' in data:
                options['return_base64'] = bool(data['return_base64'])
            
            if 'max_width' in data:
                options['max_width'] = int(data['max_width'])
            
            if 'max_height' in data:
                options['max_height'] = int(data['max_height'])
            
            logger.info(f"🔄 Processando otimização: {image_url}")
            logger.info(f"🔧 Opções: {options}")
            
            # Executar otimização
            result = optimizer.optimize_image_from_url(image_url, options)
            
            # Log do resultado
            if result['success']:
                reduction = result.get('size_reduction_percent', 0)
                from_cache = result.get('from_cache', False)
                cache_info = " (do cache)" if from_cache else ""
                logger.info(f"✅ Otimização concluída{cache_info}: {reduction:.1f}% redução")
            else:
                logger.error(f"❌ Falha na otimização: {result.get('error', 'Erro desconhecido')}")
            
            return jsonify(result), 200 if result['success'] else 400
            
        except Exception as e:
            logger.error(f"❌ Erro no endpoint optimize-image: {e}")
            return jsonify({
                'success': False,
                'error': f'Erro interno do servidor: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    @app.route('/batch-optimize', methods=['POST'])
    def batch_optimize():
        """
        Endpoint para otimização em lote
        
        POST /batch-optimize
        {
            "image_urls": ["url1", "url2", ...],
            "format": "WEBP",
            "quality": 85,
            "max_batch_size": 20
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'image_urls' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Campo image_urls é obrigatório'
                }), 400
            
            image_urls = data['image_urls']
            
            if not isinstance(image_urls, list):
                return jsonify({
                    'success': False,
                    'error': 'image_urls deve ser uma lista'
                }), 400
            
            if len(image_urls) == 0:
                return jsonify({
                    'success': False,
                    'error': 'Lista de URLs não pode estar vazia'
                }), 400
            
            max_batch = data.get('max_batch_size', 20)
            if len(image_urls) > max_batch:
                return jsonify({
                    'success': False,
                    'error': f'Máximo {max_batch} imagens por lote'
                }), 400
            
            # Opções de otimização
            options = {
                'format': data.get('format', 'WEBP').upper(),
                'quality': data.get('quality', 85),
                'is_thumbnail': data.get('is_thumbnail', False),
                'return_base64': data.get('return_base64', True)
            }
            
            logger.info(f"🔄 Iniciando lote: {len(image_urls)} imagens")
            
            # Processar lote
            result = optimizer.batch_optimize_images(image_urls, options)
            
            logger.info(f"✅ Lote concluído: {result['success_rate']}% sucesso")
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"❌ Erro no endpoint batch-optimize: {e}")
            return jsonify({
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }), 500

    @app.route('/analyze-image', methods=['POST'])
    def analyze_image():
        """
        Endpoint para análise de imagem sem otimização
        
        POST /analyze-image
        {
            "image_url": "https://example.com/image.jpg"
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'image_url' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Campo image_url é obrigatório'
                }), 400
            
            image_url = data['image_url']
            
            # Baixar e analisar imagem
            image_data, content_type = optimizer._download_image(image_url)
            
            # Análise completa
            analysis = analyze_optimization_potential(image_data)
            info = get_image_info(image_data)
            
            result = {
                'success': True,
                'image_url': image_url,
                'content_type': content_type,
                'image_info': info,
                'optimization_analysis': analysis,
                'is_generic_telegram': optimizer._is_generic_telegram_image(image_url),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"❌ Erro na análise: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/cache-stats', methods=['GET'])
    def cache_stats():
        """Estatísticas do cache"""
        try:
            stats = optimizer.get_cache_stats()
            return jsonify(stats), 200
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/clear-cache', methods=['POST'])
    def clear_cache():
        """Limpar cache de imagens"""
        try:
            data = request.get_json() or {}
            pattern = data.get('pattern', 'img_*')
            
            result = optimizer.clear_cache(pattern)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/health', methods=['GET'])
    def health():
        """Health check completo"""
        try:
            # Verificar Redis
            redis_status = 'disabled'
            if redis_client:
                try:
                    redis_client.ping()
                    redis_status = 'connected'
                except:
                    redis_status = 'error'
            
            # Verificar configurações
            config_validation = config.validate()
            
            health_data = {
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'redis_status': redis_status,
                'config_valid': config_validation['valid'],
                'config_issues': config_validation.get('issues', []),
                'optimizer_config': {
                    'max_dimensions': f"{config.MAX_WIDTH}x{config.MAX_HEIGHT}",
                    'thumbnail_size': f"{config.THUMBNAIL_WIDTH}x{config.THUMBNAIL_HEIGHT}",
                    'default_format': config.DEFAULT_FORMAT,
                    'webp_quality': config.WEBP_QUALITY,
                    'cache_ttl_hours': config.CACHE_TTL // 3600
                }
            }
            
            return jsonify(health_data), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Endpoint não encontrado',
            'available_endpoints': [
                '/optimize-image [POST]',
                '/batch-optimize [POST]',
                '/analyze-image [POST]',
                '/cache-stats [GET]',
                '/clear-cache [POST]',
                '/health [GET]'
            ]
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"❌ Erro interno: {error}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

    return app


if __name__ == '__main__':
    # Carregar variáveis de ambiente
    from dotenv import load_dotenv
    load_dotenv()
    
    # Determinar ambiente
    environment = os.getenv('FLASK_ENV', 'production')
    
    # Criar aplicação
    app = create_app(environment)
    
    # Configurações do servidor
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = environment == 'development'
    
    logger.info(f"🚀 Iniciando TopGrupos Image Optimizer")
    logger.info(f"🌍 Ambiente: {environment}")
    logger.info(f"🔗 Servidor: http://{host}:{port}")
    logger.info(f"🐛 Debug: {debug}")
    
    # Executar servidor
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )