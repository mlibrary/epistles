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
$loader->add('DLXS', __DIR__);

$app['admin.controller'] = $app->share(function() use ($app) {
    return new DLXS\Controller\AdminController();
});

$app->before(function (Request $request) {
    if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
        $data = json_decode($request->getContent(), true);
        $request->request->replace(is_array($data) ? $data : array());
    }
});

$app->before(function(Request $request) use ($app) {
    $auth_check = $app['auth.check']('apis');
    if ( ! $auth_check && $app['request']->getQueryString() != 'login' ) {
        return new Response($app['admin.login'](), 404);
    }
});

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__ . '/views',
));

$app['auth.user'] = function() {
    return function() {
        return array_key_exists('REMOTE_USER', $_SERVER) ? $_SERVER['REMOTE_USER'] : '';
    };
};

$app['auth.check'] = function($collid) use ($app) {
    return function() use ($app) {
        $users = array('rjmcinty', 'roger', 'monicats');
        $users[] = 'neenapio';
        $users[] = 'ktopham';
        $remote_user = $app['auth.user']();
        return in_array($remote_user, $users);
    };
};

$app['admin.login'] = function() use ($app) {
    return function() use ($app) {
        return $app['twig']->render('login.twig');
    };
};

$app->get('/', function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    if ( $identifier ) {
        return $app['admin.controller']->showAction($app, $identifier);
    } else {
        return $app['admin.controller']->indexAction($app);
    }
});

$app->post('/', function() use ($app) {
    $identifier = urldecode($app['request']->getQueryString());
    $action = $app['request']->request->get('action');
    if ( $identifier ) {
        $method = $action . 'Action';
        return $app['admin.controller']->$method($app, $identifier);
    }
});

$app->run();
