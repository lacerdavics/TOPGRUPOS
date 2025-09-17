"""
Configurações para o módulo de otimização de imagens
"""

import os
from typing import Dict, Any

class ImageOptimizerConfig:
    """Configurações centralizadas do otimizador"""
    
    # Configurações de dimensões
    MAX_WIDTH = int(os.getenv('IMG_MAX_WIDTH', 1920))
    MAX_HEIGHT = int(os.getenv('IMG_MAX_HEIGHT', 1080))
    THUMBNAIL_WIDTH = int(os.getenv('IMG_THUMB_WIDTH', 800))
    THUMBNAIL_HEIGHT = int(os.getenv('IMG_THUMB_HEIGHT', 800))
    
    # Configurações de qualidade
    WEBP_QUALITY = int(os.getenv('IMG_WEBP_QUALITY', 85))
    JPEG_QUALITY = int(os.getenv('IMG_JPEG_QUALITY', 90))
    AVIF_QUALITY = int(os.getenv('IMG_AVIF_QUALITY', 80))
    PNG_OPTIMIZE = os.getenv('IMG_PNG_OPTIMIZE', 'true').lower() == 'true'
    
    # Configurações de cache
    CACHE_TTL = int(os.getenv('IMG_CACHE_TTL', 86400 * 7))  # 7 dias
    CACHE_PREFIX = os.getenv('IMG_CACHE_PREFIX', 'topgrupos_img')
    
    # Configurações de rede
    DOWNLOAD_TIMEOUT = int(os.getenv('IMG_DOWNLOAD_TIMEOUT', 30))
    MAX_FILE_SIZE = int(os.getenv('IMG_MAX_FILE_SIZE', 15 * 1024 * 1024))  # 15MB
    USER_AGENT = os.getenv('IMG_USER_AGENT', 'TopGrupos-ImageOptimizer/1.0')
    
    # Redis/Upstash
    REDIS_HOST = os.getenv('UPSTASH_REDIS_HOST')
    REDIS_PORT = int(os.getenv('UPSTASH_REDIS_PORT', 6379))
    REDIS_PASSWORD = os.getenv('UPSTASH_REDIS_PASSWORD')
    REDIS_SSL = os.getenv('UPSTASH_REDIS_SSL', 'true').lower() == 'true'
    
    # Configurações de formato
    DEFAULT_FORMAT = os.getenv('IMG_DEFAULT_FORMAT', 'WEBP')
    SUPPORTED_FORMATS = ['WEBP', 'JPEG', 'AVIF', 'PNG']
    
    # Configurações de processamento
    ENABLE_PROGRESSIVE_JPEG = os.getenv('IMG_PROGRESSIVE_JPEG', 'true').lower() == 'true'
    ENABLE_OPTIMIZATION = os.getenv('IMG_ENABLE_OPTIMIZATION', 'true').lower() == 'true'
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Converte configurações para dicionário"""
        return {
            'max_width': cls.MAX_WIDTH,
            'max_height': cls.MAX_HEIGHT,
            'thumbnail_size': (cls.THUMBNAIL_WIDTH, cls.THUMBNAIL_HEIGHT),
            'webp_quality': cls.WEBP_QUALITY,
            'jpeg_quality': cls.JPEG_QUALITY,
            'avif_quality': cls.AVIF_QUALITY,
            'png_optimize': cls.PNG_OPTIMIZE,
            'cache_ttl': cls.CACHE_TTL,
            'max_file_size': cls.MAX_FILE_SIZE,
            'timeout': cls.DOWNLOAD_TIMEOUT,
            'user_agent': cls.USER_AGENT,
            'default_format': cls.DEFAULT_FORMAT,
            'enable_progressive_jpeg': cls.ENABLE_PROGRESSIVE_JPEG,
            'enable_optimization': cls.ENABLE_OPTIMIZATION
        }

    @classmethod
    def validate(cls) -> Dict[str, Any]:
        """Valida configurações"""
        issues = []
        
        if cls.MAX_WIDTH < 100 or cls.MAX_WIDTH > 4000:
            issues.append("MAX_WIDTH deve estar entre 100 e 4000")
        
        if cls.MAX_HEIGHT < 100 or cls.MAX_HEIGHT > 4000:
            issues.append("MAX_HEIGHT deve estar entre 100 e 4000")
        
        if not 1 <= cls.WEBP_QUALITY <= 100:
            issues.append("WEBP_QUALITY deve estar entre 1 e 100")
        
        if not 1 <= cls.JPEG_QUALITY <= 100:
            issues.append("JPEG_QUALITY deve estar entre 1 e 100")
        
        if cls.DEFAULT_FORMAT not in cls.SUPPORTED_FORMATS:
            issues.append(f"DEFAULT_FORMAT deve ser um de: {cls.SUPPORTED_FORMATS}")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues
        }


# Configurações específicas por ambiente
class DevelopmentConfig(ImageOptimizerConfig):
    """Configurações para desenvolvimento"""
    WEBP_QUALITY = 75  # Qualidade menor para desenvolvimento
    CACHE_TTL = 3600   # Cache menor para desenvolvimento
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB para desenvolvimento


class ProductionConfig(ImageOptimizerConfig):
    """Configurações para produção"""
    WEBP_QUALITY = 90  # Alta qualidade para produção
    CACHE_TTL = 86400 * 30  # Cache longo para produção
    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB para produção


def get_config(environment: str = None) -> ImageOptimizerConfig:
    """Retorna configuração baseada no ambiente"""
    env = environment or os.getenv('FLASK_ENV', 'production')
    
    if env == 'development':
        return DevelopmentConfig()
    else:
        return ProductionConfig()