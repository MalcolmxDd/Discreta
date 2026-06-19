// =============================================================
// Upload API — Subida de imágenes
// =============================================================

const API_BASE = '/api';

interface UploadResponse {
  url: string;
  relative_url: string;
  filename: string;
  size: number;
  mime: string;
}

/**
 * Sube una imagen al servidor y retorna la URL pública.
 * Usa FormData (multipart/form-data) en vez de JSON.
 * Requiere JWT de admin.
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('discretastore-auth-token');

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO establecer Content-Type: fetch lo setea automáticamente con boundary para FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al subir la imagen');
  }

  return data.data;
}

/**
 * Elimina una imagen del servidor por su URL pública.
 * Requiere JWT de admin.
 */
export async function deleteImage(url: string): Promise<void> {
  const token = localStorage.getItem('discretastore-auth-token');

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al eliminar la imagen');
  }
}

/**
 * Valida que un archivo sea una imagen con extensión y tamaño válidos.
 */
export function validateImage(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Solo se permiten imágenes JPG, PNG, WebP y GIF.';
  }

  if (file.size > maxSize) {
    const mb = (file.size / 1024 / 1024).toFixed(2);
    return `La imagen no puede superar los 5MB (este archivo pesa ${mb}MB).`;
  }

  return null;
}
