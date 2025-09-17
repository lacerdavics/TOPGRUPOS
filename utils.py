"""
Utilitários para o módulo de otimização de imagens
"""

import io
import hashlib
import mimetypes
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ExifTags
import logging

logger = logging.getLogger(__name__)

def get_image_info(image_data: bytes) -> Dict[str, Any]:
    """
    Extrai informações detalhadas da imagem
    
    Args:
        image_data: Dados binários da imagem
        
    Returns:
        Dict com informações da imagem
    """
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            # Informações básicas
            info = {
                'format': img.format,
                'mode': img.mode,
                'size': img.size,
                'width': img.width,
                'height': img.height,
                'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info,
                'file_size_bytes': len(image_data),
                'file_size_mb': round(len(image_data) / (1024 * 1024), 2)
            }
            
            # Informações EXIF se disponíveis
            exif_data = {}
            if hasattr(img, '_getexif') and img._getexif():
                exif = img._getexif()
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    exif_data[tag] = value
            
            info['exif'] = exif_data
            
            # Calcular proporção
            info['aspect_ratio'] = round(img.width / img.height, 2)
            
            # Determinar se é paisagem, retrato ou quadrado
            if img.width > img.height:
                info['orientation'] = 'landscape'
            elif img.height > img.width:
                info['orientation'] = 'portrait'
            else:
                info['orientation'] = 'square'
            
            return info
            
    except Exception as e:
        logger.error(f"❌ Erro ao extrair informações da imagem: {e}")
        return {'error': str(e)}

def calculate_optimal_dimensions(
    original_width: int, 
    original_height: int,
    max_width: int = 1920,
    max_height: int = 1080,
    maintain_aspect: bool = True
) -> Tuple[int, int]:
    """
    Calcula dimensões otimais mantendo proporção
    
    Args:
        original_width: Largura original
        original_height: Altura original
        max_width: Largura máxima
        max_height: Altura máxima
        maintain_aspect: Se deve manter proporção
        
    Returns:
        Tuple[int, int]: (nova_largura, nova_altura)
    """
    if original_width <= max_width and original_height <= max_height:
        return (original_width, original_height)
    
    if not maintain_aspect:
        return (min(original_width, max_width), min(original_height, max_height))
    
    # Calcular proporção para manter aspecto
    width_ratio = max_width / original_width
    height_ratio = max_height / original_height
    ratio = min(width_ratio, height_ratio)
    
    new_width = int(original_width * ratio)
    new_height = int(original_height * ratio)
    
    return (new_width, new_height)

def estimate_compression_savings(
    original_size: int,
    original_format: str,
    target_format: str,
    quality: int
) -> float:
    """
    Estima economia de compressão baseada no formato e qualidade
    
    Returns:
        float: Porcentagem estimada de redução (0-100)
    """
    # Fatores de compressão baseados em testes empíricos
    compression_factors = {
        ('PNG', 'WEBP'): 0.3 + (quality / 100) * 0.4,  # 30-70% do tamanho original
        ('PNG', 'JPEG'): 0.2 + (quality / 100) * 0.5,  # 20-70% do tamanho original
        ('JPEG', 'WEBP'): 0.7 + (quality / 100) * 0.2, # 70-90% do tamanho original
        ('JPEG', 'AVIF'): 0.5 + (quality / 100) * 0.3, # 50-80% do tamanho original
        ('PNG', 'AVIF'): 0.25 + (quality / 100) * 0.35, # 25-60% do tamanho original
    }
    
    factor = compression_factors.get((original_format, target_format), 0.8)
    estimated_new_size = original_size * factor
    reduction_percent = ((original_size - estimated_new_size) / original_size) * 100
    
    return max(0, min(95, reduction_percent))  # Limitar entre 0-95%

def validate_image_format(image_data: bytes) -> Tuple[bool, str, Optional[str]]:
    """
    Valida se os dados são de uma imagem válida
    
    Returns:
        Tuple[bool, str, Optional[str]]: (é_válida, formato, erro)
    """
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            if img.format not in ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WEBP']:
                return False, img.format or 'UNKNOWN', f"Formato não suportado: {img.format}"
            
            # Verificar se a imagem não está corrompida
            img.verify()
            
            return True, img.format, None
            
    except Exception as e:
        return False, 'INVALID', str(e)

def create_progressive_jpeg(image: Image.Image, quality: int = 90) -> bytes:
    """
    Cria JPEG progressivo otimizado
    
    Args:
        image: Imagem PIL
        quality: Qualidade (1-100)
        
    Returns:
        bytes: Dados da imagem JPEG progressiva
    """
    output_buffer = io.BytesIO()
    
    # Converter para RGB se necessário
    if image.mode != 'RGB':
        if image.mode in ('RGBA', 'LA'):
            # Criar fundo branco para transparência
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        else:
            image = image.convert('RGB')
    
    # Salvar como JPEG progressivo
    image.save(
        output_buffer,
        format='JPEG',
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling=0,  # Melhor qualidade de cor
        qtables='web_high'  # Tabelas de quantização otimizadas para web
    )
    
    return output_buffer.getvalue()

def create_optimized_webp(image: Image.Image, quality: int = 85, lossless: bool = False) -> bytes:
    """
    Cria WebP otimizado
    
    Args:
        image: Imagem PIL
        quality: Qualidade (1-100, ignorado se lossless=True)
        lossless: Se deve usar compressão sem perdas
        
    Returns:
        bytes: Dados da imagem WebP
    """
    output_buffer = io.BytesIO()
    
    save_kwargs = {
        'format': 'WEBP',
        'optimize': True,
        'method': 6  # Melhor compressão (mais lento)
    }
    
    if lossless:
        save_kwargs['lossless'] = True
    else:
        save_kwargs['quality'] = quality
    
    image.save(output_buffer, **save_kwargs)
    return output_buffer.getvalue()

def smart_crop_image(image: Image.Image, target_size: Tuple[int, int]) -> Image.Image:
    """
    Faz crop inteligente da imagem focando no centro
    
    Args:
        image: Imagem PIL
        target_size: Tamanho alvo (largura, altura)
        
    Returns:
        Image.Image: Imagem com crop aplicado
    """
    target_width, target_height = target_size
    original_width, original_height = image.size
    
    # Calcular proporções
    target_ratio = target_width / target_height
    original_ratio = original_width / original_height
    
    if abs(target_ratio - original_ratio) < 0.01:
        # Proporções similares, apenas redimensionar
        return image.resize(target_size, Image.Resampling.LANCZOS)
    
    # Determinar como fazer o crop
    if original_ratio > target_ratio:
        # Imagem mais larga, crop horizontal
        new_width = int(original_height * target_ratio)
        left = (original_width - new_width) // 2
        crop_box = (left, 0, left + new_width, original_height)
    else:
        # Imagem mais alta, crop vertical
        new_height = int(original_width / target_ratio)
        top = (original_height - new_height) // 2
        crop_box = (0, top, original_width, top + new_height)
    
    # Aplicar crop e redimensionar
    cropped = image.crop(crop_box)
    return cropped.resize(target_size, Image.Resampling.LANCZOS)

def generate_responsive_sizes(
    original_width: int,
    original_height: int,
    breakpoints: list = None
) -> Dict[str, Tuple[int, int]]:
    """
    Gera tamanhos responsivos para diferentes breakpoints
    
    Args:
        original_width: Largura original
        original_height: Altura original
        breakpoints: Lista de larguras de breakpoint
        
    Returns:
        Dict com tamanhos para cada breakpoint
    """
    if breakpoints is None:
        breakpoints = [320, 640, 768, 1024, 1280, 1920]
    
    aspect_ratio = original_width / original_height
    sizes = {}
    
    for breakpoint in breakpoints:
        if breakpoint >= original_width:
            # Não aumentar imagem além do tamanho original
            sizes[f'{breakpoint}w'] = (original_width, original_height)
        else:
            new_width = breakpoint
            new_height = int(breakpoint / aspect_ratio)
            sizes[f'{breakpoint}w'] = (new_width, new_height)
    
    return sizes

def detect_image_content_type(image_data: bytes) -> str:
    """
    Detecta o tipo de conteúdo da imagem
    
    Args:
        image_data: Dados binários da imagem
        
    Returns:
        str: MIME type da imagem
    """
    # Assinaturas de arquivo para diferentes formatos
    signatures = {
        b'\xFF\xD8\xFF': 'image/jpeg',
        b'\x89PNG\r\n\x1a\n': 'image/png',
        b'GIF87a': 'image/gif',
        b'GIF89a': 'image/gif',
        b'RIFF': 'image/webp',  # WebP começa com RIFF
        b'BM': 'image/bmp',
        b'II*\x00': 'image/tiff',
        b'MM\x00*': 'image/tiff'
    }
    
    for signature, mime_type in signatures.items():
        if image_data.startswith(signature):
            return mime_type
    
    # Fallback usando PIL
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            format_to_mime = {
                'JPEG': 'image/jpeg',
                'PNG': 'image/png',
                'GIF': 'image/gif',
                'WEBP': 'image/webp',
                'BMP': 'image/bmp',
                'TIFF': 'image/tiff'
            }
            return format_to_mime.get(img.format, 'image/unknown')
    except:
        return 'application/octet-stream'

def calculate_image_quality_score(image: Image.Image) -> float:
    """
    Calcula pontuação de qualidade da imagem (0-100)
    Baseado em resolução, nitidez e outros fatores
    
    Args:
        image: Imagem PIL
        
    Returns:
        float: Pontuação de qualidade (0-100)
    """
    try:
        width, height = image.size
        total_pixels = width * height
        
        # Pontuação base por resolução
        if total_pixels >= 1920 * 1080:  # Full HD+
            resolution_score = 100
        elif total_pixels >= 1280 * 720:  # HD
            resolution_score = 80
        elif total_pixels >= 640 * 480:   # VGA
            resolution_score = 60
        else:
            resolution_score = 40
        
        # Penalizar imagens muito pequenas
        if width < 100 or height < 100:
            resolution_score *= 0.5
        
        # Bonificar proporções adequadas (não muito estreitas)
        aspect_ratio = width / height
        if 0.5 <= aspect_ratio <= 2.0:
            aspect_bonus = 10
        else:
            aspect_bonus = 0
        
        # Verificar se tem transparência (pode afetar compressão)
        transparency_penalty = 5 if image.mode in ('RGBA', 'LA') else 0
        
        final_score = min(100, resolution_score + aspect_bonus - transparency_penalty)
        return round(final_score, 1)
        
    except Exception as e:
        logger.error(f"❌ Erro ao calcular qualidade: {e}")
        return 50.0  # Pontuação neutra em caso de erro

def is_image_worth_optimizing(
    image_data: bytes,
    min_size_kb: int = 50,
    min_dimensions: Tuple[int, int] = (200, 200)
) -> Tuple[bool, str]:
    """
    Determina se vale a pena otimizar a imagem
    
    Args:
        image_data: Dados da imagem
        min_size_kb: Tamanho mínimo em KB para otimizar
        min_dimensions: Dimensões mínimas (largura, altura)
        
    Returns:
        Tuple[bool, str]: (vale_a_pena, motivo)
    """
    try:
        # Verificar tamanho do arquivo
        size_kb = len(image_data) / 1024
        if size_kb < min_size_kb:
            return False, f"Arquivo muito pequeno ({size_kb:.1f}KB < {min_size_kb}KB)"
        
        # Verificar dimensões
        with Image.open(io.BytesIO(image_data)) as img:
            width, height = img.size
            min_width, min_height = min_dimensions
            
            if width < min_width or height < min_height:
                return False, f"Dimensões muito pequenas ({width}x{height} < {min_width}x{min_height})"
            
            # Verificar se já está em formato otimizado
            if img.format == 'WEBP' and size_kb < 500:  # WebP pequeno já otimizado
                return False, f"Já otimizado (WebP {size_kb:.1f}KB)"
            
            return True, "Imagem adequada para otimização"
            
    except Exception as e:
        return False, f"Erro na validação: {str(e)}"

def create_image_thumbnail(
    image_data: bytes,
    size: Tuple[int, int] = (300, 300),
    crop_to_fit: bool = True
) -> bytes:
    """
    Cria thumbnail da imagem
    
    Args:
        image_data: Dados da imagem original
        size: Tamanho do thumbnail
        crop_to_fit: Se deve fazer crop para ajustar exatamente
        
    Returns:
        bytes: Dados do thumbnail
    """
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            if crop_to_fit:
                # Usar smart crop
                thumbnail = smart_crop_image(img, size)
            else:
                # Redimensionar mantendo proporção
                img.thumbnail(size, Image.Resampling.LANCZOS)
                thumbnail = img
            
            # Salvar como WebP otimizado
            output_buffer = io.BytesIO()
            thumbnail.save(
                output_buffer,
                format='WEBP',
                quality=85,
                optimize=True,
                method=6
            )
            
            return output_buffer.getvalue()
            
    except Exception as e:
        logger.error(f"❌ Erro ao criar thumbnail: {e}")
        raise

def get_format_mime_type(format_name: str) -> str:
    """Retorna MIME type para formato de imagem"""
    mime_types = {
        'JPEG': 'image/jpeg',
        'PNG': 'image/png',
        'WEBP': 'image/webp',
        'AVIF': 'image/avif',
        'GIF': 'image/gif',
        'BMP': 'image/bmp',
        'TIFF': 'image/tiff'
    }
    return mime_types.get(format_name.upper(), 'image/unknown')

def optimize_for_web(image: Image.Image, target_format: str = 'WEBP', quality: int = 85) -> bytes:
    """
    Otimiza imagem especificamente para web
    
    Args:
        image: Imagem PIL
        target_format: Formato alvo
        quality: Qualidade de compressão
        
    Returns:
        bytes: Dados da imagem otimizada
    """
    output_buffer = io.BytesIO()
    
    # Aplicar otimizações específicas por formato
    if target_format == 'WEBP':
        # WebP com configurações otimizadas para web
        image.save(
            output_buffer,
            format='WEBP',
            quality=quality,
            method=6,  # Melhor compressão
            optimize=True,
            lossless=False
        )
    elif target_format == 'JPEG':
        # JPEG progressivo otimizado
        if image.mode != 'RGB':
            if image.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
            else:
                image = image.convert('RGB')
        
        image.save(
            output_buffer,
            format='JPEG',
            quality=quality,
            optimize=True,
            progressive=True,
            subsampling=0
        )
    elif target_format == 'PNG':
        # PNG otimizado
        image.save(
            output_buffer,
            format='PNG',
            optimize=True,
            compress_level=9
        )
    else:
        # Formato genérico
        image.save(output_buffer, format=target_format, optimize=True)
    
    return output_buffer.getvalue()

def analyze_optimization_potential(image_data: bytes) -> Dict[str, Any]:
    """
    Analisa potencial de otimização da imagem
    
    Args:
        image_data: Dados da imagem
        
    Returns:
        Dict com análise detalhada
    """
    try:
        info = get_image_info(image_data)
        
        if 'error' in info:
            return info
        
        analysis = {
            'current_format': info['format'],
            'current_size_mb': info['file_size_mb'],
            'dimensions': info['size'],
            'quality_score': calculate_image_quality_score(Image.open(io.BytesIO(image_data))),
            'recommendations': []
        }
        
        # Recomendações baseadas na análise
        if info['format'] == 'PNG' and not info['has_transparency']:
            analysis['recommendations'].append({
                'action': 'convert_to_webp',
                'reason': 'PNG sem transparência pode ser convertido para WebP',
                'estimated_savings': estimate_compression_savings(
                    len(image_data), 'PNG', 'WEBP', 85
                )
            })
        
        if info['width'] > 1920 or info['height'] > 1080:
            analysis['recommendations'].append({
                'action': 'resize',
                'reason': f'Imagem muito grande ({info["width"]}x{info["height"]})',
                'suggested_size': calculate_optimal_dimensions(
                    info['width'], info['height']
                )
            })
        
        if info['file_size_mb'] > 2:
            analysis['recommendations'].append({
                'action': 'compress',
                'reason': f'Arquivo grande ({info["file_size_mb"]}MB)',
                'suggested_quality': 80 if info['format'] == 'JPEG' else 85
            })
        
        return analysis
        
    except Exception as e:
        logger.error(f"❌ Erro na análise: {e}")
        return {'error': str(e)}