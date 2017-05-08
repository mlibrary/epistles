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
// $loader->add('vendor', __DIR__);

require 'vendor/Parsedown.php';

// $app['admin.controller'] = $app->share(function() use ($app) {
//     return new DLXS\Controller\AdminController();
// });

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
    'twig.options' => array('strict_variables' => false)
));

$app['access.boot'] = function() use ($app) {
    return function() use ($app) {
        return $app['twig']->render('index.twig');
    };
};

$app['access.page'] = function($identifier) use ($app) {
    return function($identifier) use ($app) {
        # $contents = "<pre>A PAGE</pre>";
        $processor = new Parsedown();
        # $contents = file_get_contents(__DIR__ . '/' . $identifier . '.md');
        $contents = file(__DIR__ . '/pages/' . $identifier . '.md');
        $title = '# ' . ucwords($identifier);
        if ( substr($contents[0], 0, 2) == '# ' ) {
            $title = array_shift($contents);
            # $title = substr($title, 2);
        }
        $contents = $processor->text(implode("\n", $contents));
        $title = $processor->text($title);
        $title = substr($title, 4, strlen($title) - 9);

        return $app['twig']->render('page.twig', array(
            'title' => $title,
            'contents' => $contents
        ));
    };
};

$app['access.show'] = function($identifier) use ($app) {
    return function($identifier) use ($app) {
        return $app['twig']->render('show.twig', array(
            'identifier' => $identifier,
            'cls' => 'access show'
        ));
    };
};

$app['access.annotation'] = function($identifier) use ($app) {
    return function($identifier) use ($app) {
        $data = $app['db']->fetchAssoc("SELECT * FROM ImageClassAnnotation WHERE identifier = ? AND published = 1", array($identifier));
        $annotations = json_decode(( $data['annotations'] ? $data['annotations'] : '[]' ), true);
        $original_translation = json_decode(( $data['original_translation'] ? $data['original_translation'] : '[]' ), true);
        // foreach($original_translation as $index => $line) {
        //     $original_translation[$index] = preg_replace('/(\{[^}]+\})/', '<span class="footnote-text">${1}</span>', $line);
        // }
        return $app->json(array(
            'annotations' => $annotations,
            'original_translation' => $original_translation
        ));
    };
};

$app->get('/', function() use ($app) {
    $identifier = $app['request']->get('identifier');
    if ( ! $identifier ) {
        $identifier = urldecode($app['request']->getQueryString());
    }
    $action = $app['request']->get('action');
    if ( ! $action ) { $action = 'show'; }
    if ( $identifier && ( strpos($identifier,":") !== false || $identifier == 'start') ) {
        return $app["access.$action"]($identifier);
    } elseif ( $identifier ) {
        return $app["access.page"]($identifier);
    } else {
        return $app['access.boot']();
    }
});

$app->run();
