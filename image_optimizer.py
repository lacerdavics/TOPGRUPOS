"""
Módulo de Otimização de Imagens para TopGrupos
Integrado com backend existente, cache Redis e validação de imagens
"""

import os
import io
import base64
import hashlib
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from PIL import Image, ImageOps
import redis
from flask import Flask, request, jsonify
from urllib.parse import urlparse
import json

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageOptimizer:
    def __init__(self, redis_client=None, config=None):
        """
        Inicializa o otimizador de imagens
        
        Args:
            redis_client: Cliente Redis para cache (Upstash)
            config: Configurações personalizadas
        """
        self.redis_client = redis_client
        self.config = config or self._get_default_config()
        
        # Configurações de otimização
        self.max_width = self.config.get('max_width', 1920)
        self.max_height = self.config.get('max_height', 1080)
        self.thumbnail_size = self.config.get('thumbnail_size', (1080, 1080))
        self.webp_quality = self.config.get('webp_quality', 85)
        self.jpeg_quality = self.config.get('jpeg_quality', 90)
        self.cache_ttl = self.config.get('cache_ttl', 86400 * 7)  # 7 dias
        
        # Formatos suportados
        self.supported_formats = ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WEBP']
        
        logger.info("🚀 ImageOptimizer inicializado com configurações:")
        logger.info(f"   Max dimensions: {self.max_width}x{self.max_height}")
        logger.info(f"   Thumbnail size: {self.thumbnail_size}")
        logger.info(f"   WebP quality: {self.webp_quality}")
        logger.info(f"   Cache TTL: {self.cache_ttl}s")

    def _get_default_config(self) -> Dict[str, Any]:
        """Configurações padrão do otimizador"""
        return {
            'max_width': 1920,
            'max_height': 1080,
            'thumbnail_size': (1080, 1080),
            'webp_quality': 85,
            'jpeg_quality': 90,
            'avif_quality': 80,
            'cache_ttl': 86400 * 7,  # 7 dias
            'max_file_size': 10 * 1024 * 1024,  # 10MB
            'timeout': 30,
            'user_agent': 'TopGrupos-ImageOptimizer/1.0'
        }

    def _generate_image_hash(self, image_data: bytes) -> str:
        """Gera hash único para a imagem"""
        return hashlib.sha256(image_data).hexdigest()[:16]

    def _is_generic_telegram_image(self, image_url: str) -> bool:
        """
        Verifica se é uma imagem genérica do Telegram
        Baseado na função existente do seu backend
        """
        if not image_url:
            return True
            
        # Padrões de imagens genéricas do Telegram
        generic_patterns = [
            'telesco.pe',
            't.me/i/userpic',
            'ui-avatars.com',
            'data:image/svg+xml'
        ]
        
        return any(pattern in image_url for pattern in generic_patterns)

    def _download_image(self, image_url: str) -> Tuple[bytes, str]:
        """
        Baixa a imagem da URL fornecida
        
        Returns:
            Tuple[bytes, str]: (dados da imagem, content-type)
        """
        try:
            logger.info(f"📥 Baixando imagem: {image_url}")
            
            headers = {
                'User-Agent': self.config['user_agent'],
                'Accept': 'image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
            
            response = requests.get(
                image_url,
                headers=headers,
                timeout=self.config['timeout'],
                stream=True
            )
            response.raise_for_status()
            
            # Verificar content-type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                raise ValueError(f"URL não retorna uma imagem válida: {content_type}")
            
            # Verificar tamanho do arquivo
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > self.config['max_file_size']:
                raise ValueError(f"Arquivo muito grande: {content_length} bytes")
            
            image_data = response.content
            
            if len(image_data) > self.config['max_file_size']:
                raise ValueError(f"Arquivo muito grande: {len(image_data)} bytes")
            
            logger.info(f"✅ Imagem baixada: {len(image_data)} bytes, tipo: {content_type}")
            return image_data, content_type
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro ao baixar imagem {image_url}: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro inesperado ao baixar {image_url}: {e}")
            raise

    def _optimize_image(self, image_data: bytes, output_format: str = 'WEBP', 
                       is_thumbnail: bool = False) -> Tuple[bytes, Dict[str, Any]]:
        """
        Otimiza a imagem: redimensiona e converte formato
        
        Args:
            image_data: Dados binários da imagem
            output_format: Formato de saída ('WEBP', 'JPEG', 'AVIF')
            is_thumbnail: Se deve criar thumbnail
            
        Returns:
            Tuple[bytes, Dict]: (dados otimizados, metadados)
        """
        try:
            logger.info(f"🔄 Otimizando imagem para formato {output_format}")
            
            # Abrir imagem com PIL
            with Image.open(io.BytesIO(image_data)) as img:
                original_size = img.size
                original_format = img.format
                original_mode = img.mode
                
                logger.info(f"📊 Imagem original: {original_size}, formato: {original_format}, modo: {original_mode}")
                
                # Converter para RGB se necessário (para WebP/JPEG)
                if img.mode in ('RGBA', 'LA', 'P') and output_format in ['JPEG']:
                    # Criar fundo branco para JPEG
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB' and output_format == 'WEBP':
                    # WebP suporta transparência, manter RGBA se necessário
                    if img.mode not in ['RGB', 'RGBA']:
                        img = img.convert('RGBA')
                
                # Aplicar orientação EXIF se presente
                img = ImageOps.exif_transpose(img)
                
                # Redimensionar se necessário
                new_size = self._calculate_new_size(img.size, is_thumbnail)
                if new_size != img.size:
                    logger.info(f"📏 Redimensionando de {img.size} para {new_size}")
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Salvar imagem otimizada
                output_buffer = io.BytesIO()
                save_kwargs = self._get_save_kwargs(output_format)
                
                img.save(output_buffer, format=output_format, **save_kwargs)
                optimized_data = output_buffer.getvalue()
                
                # Calcular estatísticas
                size_reduction = ((len(image_data) - len(optimized_data)) / len(image_data)) * 100
                
                metadata = {
                    'original_size': original_size,
                    'new_size': new_size,
                    'original_format': original_format,
                    'new_format': output_format,
                    'original_bytes': len(image_data),
                    'optimized_bytes': len(optimized_data),
                    'size_reduction_percent': round(size_reduction, 2),
                    'compression_ratio': round(len(image_data) / len(optimized_data), 2)
                }
                
                logger.info(f"✅ Otimização concluída: {size_reduction:.1f}% de redução")
                return optimized_data, metadata
                
        except Exception as e:
            logger.error(f"❌ Erro na otimização: {e}")
            raise

    def _calculate_new_size(self, original_size: Tuple[int, int], 
                           is_thumbnail: bool = False) -> Tuple[int, int]:
        """Calcula novo tamanho mantendo proporção"""
        width, height = original_size
        
        if is_thumbnail:
            # Para thumbnails, usar tamanho fixo com crop
            target_width, target_height = self.thumbnail_size
            
            # Calcular proporção para manter aspecto
            ratio = min(target_width / width, target_height / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            return (new_width, new_height)
        
        # Para imagens normais, respeitar limites máximos
        if width <= self.max_width and height <= self.max_height:
            return original_size
        
        # Calcular nova proporção
        ratio = min(self.max_width / width, self.max_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        return (new_width, new_height)

    def _get_save_kwargs(self, output_format: str) -> Dict[str, Any]:
        """Retorna parâmetros de salvamento para cada formato"""
        if output_format == 'WEBP':
            return {
                'quality': self.webp_quality,
                'method': 6,  # Melhor compressão
                'optimize': True
            }
        elif output_format == 'JPEG':
            return {
                'quality': self.jpeg_quality,
                'optimize': True,
                'progressive': True
            }
        elif output_format == 'AVIF':
            return {
                'quality': self.config.get('avif_quality', 80),
                'speed': 6  # Melhor qualidade
            }
        else:
            return {'optimize': True}

    def _get_cache_key(self, image_url: str, options: Dict[str, Any]) -> str:
        """Gera chave única para cache baseada na URL e opções"""
        options_str = json.dumps(options, sort_keys=True)
        combined = f"{image_url}:{options_str}"
        return f"img_opt:{hashlib.md5(combined.encode()).hexdigest()}"

    def _save_to_cache(self, cache_key: str, data: Dict[str, Any]) -> None:
        """Salva dados no cache Redis"""
        if not self.redis_client:
            return
            
        try:
            cache_data = {
                **data,
                'cached_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(seconds=self.cache_ttl)).isoformat()
            }
            
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(cache_data, default=str)
            )
            logger.info(f"💾 Dados salvos no cache: {cache_key}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar no cache: {e}")

    def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Recupera dados do cache Redis"""
        if not self.redis_client:
            return None
            
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                logger.info(f"🎯 Cache HIT: {cache_key}")
                return data
            else:
                logger.info(f"❌ Cache MISS: {cache_key}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erro ao ler cache: {e}")
            return None

    def optimize_image_from_url(self, image_url: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Função principal para otimizar imagem a partir de URL
        
        Args:
            image_url: URL da imagem a ser otimizada
            options: Opções de otimização personalizadas
            
        Returns:
            Dict com resultado da otimização
        """
        start_time = datetime.utcnow()
        
        try:
            # Configurações padrão + personalizadas
            opt_options = {
                'format': 'WEBP',
                'quality': self.webp_quality,
                'is_thumbnail': False,
                'return_base64': True,
                **(options or {})
            }
            
            logger.info(f"🔄 Iniciando otimização: {image_url}")
            logger.info(f"🔧 Opções: {opt_options}")
            
            # Verificar se é imagem genérica do Telegram
            if self._is_generic_telegram_image(image_url):
                logger.warning(f"⚠️ Imagem genérica detectada: {image_url}")
                return {
                    'success': False,
                    'error': 'Imagem genérica do Telegram não será otimizada',
                    'original_url': image_url,
                    'is_generic': True
                }
            
            # Gerar chave de cache
            cache_key = self._get_cache_key(image_url, opt_options)
            
            # Verificar cache primeiro
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                logger.info(f"✅ Retornando resultado do cache")
                cached_result['from_cache'] = True
                return cached_result
            
            # Baixar imagem
            image_data, content_type = self._download_image(image_url)
            
            # Gerar hash da imagem original
            original_hash = self._generate_image_hash(image_data)
            
            # Verificar se já temos esta imagem otimizada (mesmo hash)
            hash_cache_key = f"img_hash:{original_hash}:{opt_options['format']}:{opt_options['quality']}"
            hash_cached = self._get_from_cache(hash_cache_key)
            if hash_cached:
                logger.info(f"🎯 Imagem já otimizada encontrada pelo hash: {original_hash}")
                hash_cached['from_cache'] = True
                hash_cached['cache_type'] = 'hash_match'
                return hash_cached
            
            # Otimizar imagem
            optimized_data, metadata = self._optimize_image(
                image_data, 
                opt_options['format'],
                opt_options['is_thumbnail']
            )
            
            # Preparar resultado
            result = {
                'success': True,
                'original_url': image_url,
                'original_hash': original_hash,
                'metadata': metadata,
                'size_reduction_percent': metadata['size_reduction_percent'],
                'timestamp': start_time.isoformat(),
                'from_cache': False,
                'processing_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
            }
            
            # Adicionar dados otimizados (Base64 ou URL)
            if opt_options['return_base64']:
                optimized_base64 = base64.b64encode(optimized_data).decode('utf-8')
                mime_type = f"image/{opt_options['format'].lower()}"
                result['optimized_base64'] = f"data:{mime_type};base64,{optimized_base64}"
                result['optimized_url_or_base64'] = result['optimized_base64']
            else:
                # TODO: Implementar salvamento em arquivo/CDN
                result['optimized_url'] = f"/optimized/{original_hash}.{opt_options['format'].lower()}"
                result['optimized_url_or_base64'] = result['optimized_url']
            
            # Salvar no cache (tanto por URL quanto por hash)
            self._save_to_cache(cache_key, result)
            self._save_to_cache(hash_cache_key, result)
            
            logger.info(f"✅ Otimização concluída: {metadata['size_reduction_percent']:.1f}% redução")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro na otimização de {image_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'original_url': image_url,
                'timestamp': start_time.isoformat(),
                'from_cache': False
            }

    def batch_optimize_images(self, image_urls: list, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Otimiza múltiplas imagens em lote
        
        Args:
            image_urls: Lista de URLs de imagens
            options: Opções de otimização
            
        Returns:
            Dict com resultados de todas as otimizações
        """
        logger.info(f"🔄 Iniciando otimização em lote: {len(image_urls)} imagens")
        
        results = []
        successful = 0
        failed = 0
        
        for i, url in enumerate(image_urls):
            logger.info(f"📸 Processando imagem {i+1}/{len(image_urls)}: {url}")
            
            result = self.optimize_image_from_url(url, options)
            results.append(result)
            
            if result['success']:
                successful += 1
            else:
                failed += 1
        
        summary = {
            'total_images': len(image_urls),
            'successful': successful,
            'failed': failed,
            'success_rate': round((successful / len(image_urls)) * 100, 2) if image_urls else 0,
            'results': results
        }
        
        logger.info(f"✅ Lote concluído: {successful}/{len(image_urls)} sucessos ({summary['success_rate']}%)")
        return summary

    def get_cache_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        if not self.redis_client:
            return {'cache_enabled': False}
        
        try:
            # Buscar chaves relacionadas a imagens
            keys = self.redis_client.keys('img_opt:*') + self.redis_client.keys('img_hash:*')
            
            total_size = 0
            for key in keys[:100]:  # Limitar para não sobrecarregar
                try:
                    size = self.redis_client.memory_usage(key)
                    if size:
                        total_size += size
                except:
                    pass
            
            return {
                'cache_enabled': True,
                'total_keys': len(keys),
                'estimated_size_mb': round(total_size / (1024 * 1024), 2),
                'redis_info': self.redis_client.info('memory')
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter stats do cache: {e}")
            return {'cache_enabled': True, 'error': str(e)}

    def clear_cache(self, pattern: str = 'img_*') -> Dict[str, Any]:
        """Limpa cache de imagens"""
        if not self.redis_client:
            return {'cache_enabled': False}
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"🗑️ Cache limpo: {deleted} chaves removidas")
                return {'deleted_keys': deleted, 'success': True}
            else:
                return {'deleted_keys': 0, 'success': True, 'message': 'Nenhuma chave encontrada'}
                
        except Exception as e:
            logger.error(f"❌ Erro ao limpar cache: {e}")
            return {'success': False, 'error': str(e)}


# Flask App Integration
def create_image_optimizer_app(redis_client=None, config=None):
    """
    Cria aplicação Flask com endpoints de otimização de imagem
    """
    app = Flask(__name__)
    optimizer = ImageOptimizer(redis_client, config)
    
    @app.route('/optimize-image', methods=['POST'])
    def optimize_image_endpoint():
        """
        Endpoint principal para otimização de imagens
        
        POST /optimize-image
        {
            "image_url": "https://example.com/image.jpg",
            "format": "WEBP",  // opcional: WEBP, JPEG, AVIF
            "quality": 85,     // opcional: 1-100
            "is_thumbnail": false,  // opcional: true para thumbnails
            "return_base64": true   // opcional: retornar base64 ou URL
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'image_url' not in data:
                return jsonify({
                    'success': False,
                    'error': 'image_url é obrigatório'
                }), 400
            
            image_url = data['image_url']
            
            # Validar URL
            try:
                parsed = urlparse(image_url)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError("URL inválida")
            except Exception:
                return jsonify({
                    'success': False,
                    'error': 'URL de imagem inválida'
                }), 400
            
            # Opções de otimização
            options = {
                'format': data.get('format', 'WEBP').upper(),
                'quality': data.get('quality', 85),
                'is_thumbnail': data.get('is_thumbnail', False),
                'return_base64': data.get('return_base64', True)
            }
            
            # Validar formato
            if options['format'] not in ['WEBP', 'JPEG', 'AVIF', 'PNG']:
                return jsonify({
                    'success': False,
                    'error': 'Formato não suportado. Use: WEBP, JPEG, AVIF, PNG'
                }), 400
            
            # Validar qualidade
            if not 1 <= options['quality'] <= 100:
                return jsonify({
                    'success': False,
                    'error': 'Qualidade deve estar entre 1 e 100'
                }), 400
            
            # Otimizar imagem
            result = optimizer.optimize_image_from_url(image_url, options)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
        except Exception as e:
            logger.error(f"❌ Erro no endpoint optimize-image: {e}")
            return jsonify({
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }), 500

    @app.route('/batch-optimize', methods=['POST'])
    def batch_optimize_endpoint():
        """
        Endpoint para otimização em lote
        
        POST /batch-optimize
        {
            "image_urls": ["url1", "url2", ...],
            "format": "WEBP",
            "quality": 85
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'image_urls' not in data:
                return jsonify({
                    'success': False,
                    'error': 'image_urls é obrigatório'
                }), 400
            
            image_urls = data['image_urls']
            
            if not isinstance(image_urls, list) or len(image_urls) == 0:
                return jsonify({
                    'success': False,
                    'error': 'image_urls deve ser uma lista não vazia'
                }), 400
            
            if len(image_urls) > 50:  # Limite para evitar sobrecarga
                return jsonify({
                    'success': False,
                    'error': 'Máximo 50 imagens por lote'
                }), 400
            
            # Opções de otimização
            options = {
                'format': data.get('format', 'WEBP').upper(),
                'quality': data.get('quality', 85),
                'is_thumbnail': data.get('is_thumbnail', False),
                'return_base64': data.get('return_base64', True)
            }
            
            # Processar lote
            result = optimizer.batch_optimize_images(image_urls, options)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"❌ Erro no endpoint batch-optimize: {e}")
            return jsonify({
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }), 500

    @app.route('/cache-stats', methods=['GET'])
    def cache_stats_endpoint():
        """Endpoint para estatísticas do cache"""
        try:
            stats = optimizer.get_cache_stats()
            return jsonify(stats), 200
        except Exception as e:
            logger.error(f"❌ Erro ao obter stats: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/clear-cache', methods=['POST'])
    def clear_cache_endpoint():
        """Endpoint para limpar cache"""
        try:
            data = request.get_json() or {}
            pattern = data.get('pattern', 'img_*')
            
            result = optimizer.clear_cache(pattern)
            return jsonify(result), 200
        except Exception as e:
            logger.error(f"❌ Erro ao limpar cache: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check do serviço"""
        try:
            redis_status = 'connected' if optimizer.redis_client else 'disabled'
            if optimizer.redis_client:
                try:
                    optimizer.redis_client.ping()
                except:
                    redis_status = 'error'
            
            return jsonify({
                'status': 'healthy',
                'redis_status': redis_status,
                'config': {
                    'max_dimensions': f"{optimizer.max_width}x{optimizer.max_height}",
                    'thumbnail_size': optimizer.thumbnail_size,
                    'webp_quality': optimizer.webp_quality,
                    'cache_ttl': optimizer.cache_ttl
                },
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 500

    return app


# Exemplo de uso e configuração
if __name__ == '__main__':
    # Configuração do Redis (Upstash)
    redis_client = redis.Redis(
        host=os.getenv('UPSTASH_REDIS_HOST', 'localhost'),
        port=int(os.getenv('UPSTASH_REDIS_PORT', 6379)),
        password=os.getenv('UPSTASH_REDIS_PASSWORD'),
        decode_responses=False,  # Para dados binários
        ssl=True if os.getenv('UPSTASH_REDIS_HOST') else False
    )
    
    # Configuração personalizada
    custom_config = {
        'max_width': 1920,
        'max_height': 1080,
        'thumbnail_size': (800, 800),
        'webp_quality': 85,
        'jpeg_quality': 90,
        'cache_ttl': 86400 * 7,  # 7 dias
        'max_file_size': 15 * 1024 * 1024,  # 15MB
        'timeout': 30
    }
    
    # Criar aplicação
    app = create_image_optimizer_app(redis_client, custom_config)
    
    # Executar servidor
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )