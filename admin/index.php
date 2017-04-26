<?php

$t0 = microtime(true);

$silexRoot = $_SERVER['DLXSROOT'] . '/web/i/image/api/';
$app = require $silexRoot . 'bootstrap.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
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

$app->before(function(Request $request) use ($app) {
    $auth_check = $app['auth.check']('apis');
    if ( ! $auth_check && $app['request']->getQueryString() != 'login' ) {
        return new Response($app['admin.login'], 404);
    }
});

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__ . '/views',
));

$app['auth.user'] = $app->protect(function() {
    return array_key_exists('REMOTE_USER', $_SERVER) ? $_SERVER['REMOTE_USER'] : '';
});

$app['auth.check'] = $app->protect(function($collid) use ($app) {
    $users = array('rjmcinty', 'roger', 'monicats');
    $remote_user = $app['auth.user']();
    return in_array($remote_user, $users);
});

$app['admin.login'] = $app->share(function() use ($app) {
    return $app['twig']->render('login.twig');
});

$app['admin.index'] = $app->share(function() use ($app) {
    // in the real world this should be made more efficient?
    $bbdbid = 1642074445;
    $sql = "SELECT * FROM BookBagItems WHERE bbid = ? ORDER BY userorder";
    $items = $app['db']->fetchAll($sql, array($bbdbid));
    $results = [];
    foreach($items as $item) {
        $collid = $item['collid'];
        $record = $app['db']->fetchAssoc("SELECT * FROM ${collid}, ${collid}_media WHERE ic_id = m_id AND istruct_isentryid = ?", array($item['itemid']));
        // $tmp = str_replace('S-' . strtoupper($collid) . '-X-', '', $result['itemid']);
        // list($m_id, $m_iid) = explode(']', $tmp);
        $m_id = $record['m_id'];
        $m_iid = $record['m_iid'];
        $identifier = "$collid:$m_id:$m_iid";
        $result = array('identifier' => $identifier, 'm_id' => $m_id, 'm_iid' => $m_iid, 'collid' => $collid, 'path' => substr($collid, 0, 1) . '/' . $collid);
        $data = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 0", array($identifier));
        $published = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 1", array($identifier));
        $result['updated_at'] = $data ? $data['updated_at'] : null;
        $result['published_at'] = $published ? $published['published_at'] : null;
        $result['caption'] = explode('|||', $record['istruct_caption']);
        $class = 'missing';
        if ( $result['updated_at'] ) {
            if ( $result['published_at'] && $result['published_at'] >= $result['updated_at'] ) {
                $class = 'published';
            } else {
                $class = 'draft';
            }
        }
        $result['class'] = $class;
        $results[] = $result;
    }

    return $app['twig']->render('index.twig', array(
        'results' => $results
    ));

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
    if ( $published === false || $data['updated_at'] > $published['updated_at'] ) {
        $is_modified = true;
    }

    $original_translation = json_decode(( $data['original_translation'] ? $data['original_translation'] : '[]' ), true);
    foreach($original_translation as $index => $line) {
        $original_translation[$index] = preg_replace('/(\{[^}]+\})/', '<span class="footnote-text">${1}</span>', $line);
    }

    return $app['twig']->render('show.twig', array(
        'identifier' => $identifier,
        'published' => $published,
        'updated_at' => $data ? $data['updated_at'] : null,
        'annotations' => $data ? $data['annotations'] : '[]',
        'original_translation' => $original_translation,
        'asset' => $asset,
        'debug' => $debug,
    ));
});

$app['admin.update'] = $app->share(function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());

    $expr = [];
    $params = [];
    $params[] = $identifier;

    // only annotations are updatable now
    $possibles = array('annotations'); // , 'footnotes');

    foreach($possibles as $key) {
        if ( $app['request']->request->has($key) ) {
            $expr[] = "$key = ?";
            $data = $app['request']->request->get($key);
            $params[] = json_encode($data);            
        }
    }

    $params[] = $app['auth.user']();

    // archive the current version
    $sql = <<<SQL
INSERT INTO ImageClassAnnotationArchive 
SELECT NULL, identifier, published, annotations, original_translation, remote_user, updated_at, published_at 
FROM ImageClassAnnotation WHERE identifier = ? AND published = 0
SQL;
    $app['db']->executeUpdate($sql, array($identifier));

    // $sql = "UPDATE ImageClassAnnotation SET updated_at = NOW(), " . implode(',', $expr) . " WHERE identifier = ? AND published = 0";

    $sql = "REPLACE INTO ImageClassAnnotation ( identifier, published, annotations, remote_user, updated_at ) VALUES ( ?, 0, ?, ?, NOW() )";

    $retval = $app['db']->executeUpdate($sql, $params);

    return $app->json(array('updated' => $retval, 'updated_at' => time()));

});

$app['admin.publish'] = $app->share(function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    $data = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 0", array($identifier));
    $sql = "REPLACE INTO ImageClassAnnotation ( identifier, published, annotations, original_translation, updated_at, published_at ) VALUES ( ?, 1, ?, ?, ?, NOW() )";
    $params = [];
    $params[] = $identifier;
    $params[] = $data['annotations'];
    $params[] = $data['original_translation'];
    $params[] = $data['updated_at'];
    $retval = $app['db']->executeUpdate($sql, $params);
    return $app->json(array('updated' => $identifier, 'published_at' => time()));
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
