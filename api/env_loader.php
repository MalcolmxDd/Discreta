<?php
// =============================================================
// Cargador de variables de entorno (.env)
// =============================================================
// Busca el archivo .env en el mismo directorio que este script.
// Si no existe, las constantes se definen con valores por defecto
// definidos en config.php (fallback para desarrollo).

function loadEnv(string $dir): void {
    $envFile = rtrim($dir, '/') . '/.env';
    
    if (!file_exists($envFile)) {
        return; // Fallback silencioso a config.php
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) return;
    
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Saltar comentarios y líneas vacías
        if ($line === '' || str_starts_with($line, '#')) continue;
        
        // Parsear VAR=VAL (solo primera = separa clave/valor)
        $pos = strpos($line, '=');
        if ($pos === false) continue;
        
        $key = trim(substr($line, 0, $pos));
        $val = trim(substr($line, $pos + 1));
        
        if ($key === '') continue;
        
        // Remover comillas envolventes si existen
        if (strlen($val) >= 2) {
            if (($val[0] === '"' && $val[-1] === '"') || 
                ($val[0] === "'" && $val[-1] === "'")) {
                $val = substr($val, 1, -1);
            }
        }
        
        // Poner en entorno (getenv() podrá leerlo)
        putenv("$key=$val");
        $_ENV[$key] = $val;
    }
}
