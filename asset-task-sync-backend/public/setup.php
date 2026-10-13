<?php
/**
 * =====================================================================
 *  EEC eSupport — One-Time Setup Script (No Terminal Required)
 * =====================================================================
 *
 * INSTRUCTIONS:
 *  1. Upload this file to:  api-esupport.eec.com.et/public/setup.php
 *  2. Visit in your browser: https://api-esupport.eec.com.et/setup.php?token=EEC_SETUP_2024
 *  3. Wait for all steps to show ✅
 *  4. DELETE this file immediately from cPanel File Manager after use!
 *
 * SECURITY: This script is protected by the token above.
 *           Anyone who knows the token can run migrations — delete it after use.
 * =====================================================================
 */

// ── Security token ──────────────────────────────────────────────────────────
define('SETUP_TOKEN', 'EEC_SETUP_2024');

if (($_GET['token'] ?? '') !== SETUP_TOKEN) {
    http_response_code(403);
    die('403 Forbidden. Access denied.');
}

// ── Bootstrap Laravel ────────────────────────────────────────────────────────
define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

// ── HTML Output ──────────────────────────────────────────────────────────────
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>EEC eSupport — Server Setup</title>
<style>
  body { font-family: monospace; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1   { color: #58a6ff; }
  .ok  { color: #3fb950; }
  .err { color: #f85149; }
  .info{ color: #d29922; }
  pre  { background: #161b22; padding: 1rem; border-radius: 6px; white-space: pre-wrap; }
  .warn{ background: #3d1f00; border-left: 4px solid #f85149; padding: .5rem 1rem; margin-top: 2rem; }
</style>
</head>
<body>
<h1>🚀 EEC eSupport — Server Setup</h1>
<pre>
<?php

function run(string $label, string $command, bool $force = true): void
{
    global $kernel;
    echo "▶ {$label}... ";
    flush();
    ob_flush();

    $args = array_filter(explode(' ', $command));
    $cmd  = array_shift($args);

    // Build input array
    $input = ['command' => $cmd];
    foreach ($args as $arg) {
        if (str_starts_with($arg, '--')) {
            $input[ltrim($arg, '-')] = true;
        }
    }
    if ($force) {
        $input['--force'] = true;
    }

    $output = new \Symfony\Component\Console\Output\BufferedOutput();

    try {
        $exitCode = $kernel->call($cmd, array_merge($input, $force ? ['--force' => true] : []), $output);
        $out = trim($output->fetch());
        if ($exitCode === 0) {
            echo "<span class='ok'>✅ Done</span>\n";
        } else {
            echo "<span class='err'>❌ Exit {$exitCode}</span>\n";
        }
        if ($out) {
            echo "  <span class='info'>{$out}</span>\n";
        }
    } catch (\Throwable $e) {
        echo "<span class='err'>❌ ERROR: " . htmlspecialchars($e->getMessage()) . "</span>\n";
    }
    flush();
    ob_flush();
}

// ── Step 0: Create & fix storage directories ─────────────────────────────────
echo "▶ 0/8  Create & fix storage directory structure... ";
flush(); ob_flush();

$base = __DIR__ . '/../storage';
$required = [
    $base,
    $base . '/app',
    $base . '/app/public',
    $base . '/app/private',
    $base . '/framework',
    $base . '/framework/cache',
    $base . '/framework/cache/data',
    $base . '/framework/sessions',
    $base . '/framework/testing',
    $base . '/framework/views',
    $base . '/logs',
    __DIR__ . '/../bootstrap/cache',
];

$errors = [];
foreach ($required as $dir) {
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0775, true)) {
            $errors[] = $dir;
        }
    }
    @chmod($dir, 0775);
}

if (empty($errors)) {
    echo "<span class='ok'>✅ Done</span>\n";
} else {
    echo "<span class='err'>⚠ Could not create: " . implode(', ', $errors) . "</span>\n";
}
flush(); ob_flush();

// ── Run setup steps ──────────────────────────────────────────────────────────

run('1/8  Clear config cache',  'config:clear',   false);
run('2/8  Clear route cache',   'route:clear',    false);
run('3/8  Clear view cache',    'view:clear',     false);
run('4/8  Run migrations',      'migrate --seed', true);
run('5/8  Cache config',        'config:cache',   false);
run('6/8  Cache routes',        'route:cache',    false);

// Storage link — needs special handling
echo "\n▶ 7/8  Create storage link... ";
flush(); ob_flush();
$link   = __DIR__ . '/storage';
$target = __DIR__ . '/../storage/app/public';

if (is_link($link)) {
    echo "<span class='ok'>✅ Already linked</span>\n";
} elseif (file_exists($link)) {
    echo "<span class='err'>❌ A file/folder named 'storage' already exists in public/ — remove it first</span>\n";
} else {
    if (@symlink($target, $link)) {
        echo "<span class='ok'>✅ Done</span>\n";
    } else {
        echo "<span class='err'>❌ symlink() failed — cPanel may not allow symlinks; skip this step if not using file uploads</span>\n";
    }
}

// Final permissions fix
echo "\n▶ 8/8  Fix storage & cache permissions... ";
flush(); ob_flush();

$writableDirs = [
    __DIR__ . '/../storage',
    __DIR__ . '/../bootstrap/cache',
];

function chmodRecursive(string $path, int $mode): void
{
    @chmod($path, $mode);
    if (is_dir($path)) {
        foreach (scandir($path) as $item) {
            if ($item === '.' || $item === '..') continue;
            chmodRecursive($path . '/' . $item, $mode);
        }
    }
}

foreach ($writableDirs as $dir) {
    chmodRecursive($dir, 0775);
}
echo "<span class='ok'>✅ Done</span>\n";

echo "\n<span class='ok'>════════════════════════════════════════════</span>\n";
echo "<span class='ok'>  ✅ Setup complete! You can now log in.</span>\n";
echo "<span class='ok'>════════════════════════════════════════════</span>\n";
echo "\n<span class='err'>⚠️  DELETE this file now: api-esupport.eec.com.et/public/setup.php</span>\n";
?>
</pre>

<div class="warn">
  <strong>🔴 IMPORTANT — Delete this file now!</strong><br>
  Go to cPanel → File Manager → <code>api-esupport.eec.com.et/public/setup.php</code> → Delete.<br>
  Leaving this file online is a security risk.
</div>

</body>
</html>
