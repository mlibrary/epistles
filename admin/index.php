<?php

$t0 = microtime(true);

$silexRoot = $_SERVER['DLXSROOT'] . '/web/i/image/api/';
$app = require $silexRoot . 'bootstrap.php';
$loader->add('Twig_', $silexRoot . 'silex/vendor/twig/twig/lib');
$loader->add('Symfony\\Bridge\\Twig\\', $silexRoot . 'silex/vendor/symfony/twig-bridge');
$loader->add('Symfony\\Component\\Console\\', $silexRoot . '/silex/vendor/symfony/console');

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__ . '/views',
));

$app['admin.index'] = $app->share(function() use ($app) {
    return "INDEX";
});

$app['admin.show'] = $app->share(function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    list($collid, $m_id, $m_iid) = explode(":", $identifier);

    $debug = '';

    $asset = $app['db']->fetchAssoc("SELECT a.* FROM ImageClassAsset a, ${collid}_media b WhERE a.collid = ? AND b.m_fn = a.basename AND b.m_id = ? AND b.m_iid = ? AND a.access = 1",
        array($collid, $m_id, $m_iid));
    $data = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ?", array($identifier));

    $tmp = json_decode(( $data['annotations'] ? $data['annotations'] : '[]' ), false);
    $annotations = array();
    foreach ( $tmp as $tuple ) {
        $datum = array();
        $datum['text'] = array_pop($tuple);
        if ( $tuple[0] == 'polygon' ) {
            array_shift($tuple);
            $datum['type'] = 'polygon';
            $datum['points'] = json_encode($tuple);
        } else {
            $datum['type'] = 'rectangle';
            $datum['points'] = json_encode($tuple);
        }
        $annotations[] = $datum;
    }

    // $f = json_decode($data['footnotes'], true);
    // $debug = print_r(array_keys($f), true);

    return $app['twig']->render('show.twig', array(
        'identifier' => $identifier,
        'annotations' => $data['annotations'],
        'footnotes' => json_decode(( $data['footnotes'] ? $data['footnotes'] : '{}' ), true),
        'original_translation' => json_decode(( $data['original_translation'] ? $data['original_translation'] : '[]' ), true),
        'asset' => $asset,
        'debug' => $debug,
    ));
});

$app['admin.edit'] = $app->share(function() use ($app) {
    $identifier = $app['request']->getQueryString();
    $message = $app['request']->attributes->get('message');
    return $app['twig']->render('edit.twig', array(
        'identifier' => $identifier,
        'message' => $message
    ));
});

$app->get('/', function() use ($app) {
    $identifier = $app['request']->getQueryString();
    if ( $identifier ) {
        return $app['admin.show'];
    } else {
        return $app['admin.index'];
    }
});

$app->post('/', function() use ($app) {
    $identifier = $app['request']->getQueryString();
    if ( $identifier ) {
        return $app['admin.edit'];
    }
});

$app->run();
