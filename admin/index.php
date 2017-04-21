<?php

$t0 = microtime(true);

$silexRoot = $_SERVER['DLXSROOT'] . '/web/i/image/api/';
$app = require $silexRoot . 'bootstrap.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ParameterBag;

$loader->add('Twig_', $silexRoot . 'silex/vendor/twig/twig/lib');
$loader->add('Symfony\\Bridge\\Twig\\', $silexRoot . 'silex/vendor/symfony/twig-bridge');
$loader->add('Symfony\\Component\\Console\\', $silexRoot . '/silex/vendor/symfony/console');

$app->before(function (Request $request) {
    if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
        $data = json_decode($request->getContent(), true);
        $request->request->replace(is_array($data) ? $data : array());
    }
});

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
    $data = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 0", array($identifier));
    $published = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 1", array($identifier));
    $is_modified = false;
    if ( $published === false || $data['updated'] > $published['updated'] ) {
        $is_modified = true;
    }

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
        'published' => $published,
        'updated_at' => $data['updated_at'],
        'annotations' => $data['annotations'],
        'footnotes' => $data['footnotes'],
        'original_translation' => json_decode(( $data['original_translation'] ? $data['original_translation'] : '[]' ), true),
        'asset' => $asset,
        'debug' => $debug,
    ));
});

$app['admin.update'] = $app->share(function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    // $json_data = file_get_contents('php://input');
    // $message = $app['request']->attributes->get('message');

    $expr = [];
    $params = [];

    $possibles = array('annotations', 'footnotes');

    foreach($possibles as $key) {
        if ( $app['request']->request->has($key) ) {
            $expr[] = "$key = ?";
            $data = $app['request']->request->get($key);
            $params[] = json_encode($data);            
        }
    }

    $params[] = $identifier;

    $sql = "UPDATE ImageClassAnnotation SET updated_at = NOW(), " . implode(',', $expr) . " WHERE identifier = ? AND published = 0";
    $retval = $app['db']->executeUpdate($sql, $params);

    return $app->json(array('updated' => $retval, 'updated_at' => time()));

});

$app['admin.publish'] = $app->share(function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    return $app->json(array('updated' => $identifier));
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
        $action = $app['request']->request->get('action');
        return $app["admin.$action"];
    }
});

$app->run();
