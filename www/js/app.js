// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic',
    'starter.controllers',
    'starter.services',
    'starter.filters',
    'ngCordova'])

        .run(function ($ionicPlatform, authService, $rootScope, $state, $ionicHistory,
                $ionicModal, $localstorage, $ionicLoading, $ionicPopup, 
                $cordovaInAppBrowser) {

            $rootScope.showLoader = function (enabled) {
                if (enabled) {
                    $ionicLoading.show({
                        template: '<ion-spinner icon="android"></ion-spinner>',
                        animation: 'fade-in',
                        showBackdrop: true,
                        maxWidth: 120,
                        showDelay: 0
                    });
                } else {
                    $ionicLoading.hide();
                }
            };

            // Error Handler
            $rootScope.error = function (text) {
                $ionicPopup.alert({
                    title: 'Control GPS',
                    template: text
                });
            };

            // Message Handler
            $rootScope.showMessage = function (text) {
                $ionicPopup.alert({
                    title: 'Control GPS',
                    template: text
                });
            };

            // Force Logout
            $rootScope.forceLogout = function () {
                authService.setUser({});
                $state.go('login');
                $ionicHistory.nextViewOptions({disableBack: 'true'});
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
            };

            

            $ionicPlatform.ready(function () {

                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    // For now, enable the keyboard accessories on iOS
                    if (ionic.Platform.isIOS()) {
                        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                    }

                    cordova.plugins.Keyboard.disableScroll(true);

                    
                }
                
                if (window.StatusBar) {
                    // org.apache.cordova.statusbar required
                    StatusBar.style(1);
                }
            });

            $rootScope.$on('$cordovaInAppBrowser:loadstart', function(e, event){

            });

            $rootScope.$on('$cordovaInAppBrowser:loadstop', function(e, event){
                // insert CSS via code / file
                $cordovaInAppBrowser.insertCSS({
                    code: 'body {background-color:blue;}'
                });

                // insert Javascript via code / file
                /*$cordovaInAppBrowser.executeScript({
                  file: 'script.js'
                });*/
            });

            $rootScope.$on('$cordovaInAppBrowser:loaderror', function(e, event){

            });

            $rootScope.$on('$cordovaInAppBrowser:exit', function(e, event){

            });

        })

        .config(function ($stateProvider, $urlRouterProvider, $sceDelegateProvider, $compileProvider) {

            //$sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$')]);

            $stateProvider

                    .state('app', {
                        url: '/app',
                        abstract: true,
                        cache: false,
                        templateUrl: 'templates/menu.html',
                        controller: 'AppCtrl'
                    })

                    .state('login', {
                        url: '/login',
                        cache: false,
                        templateUrl: 'templates/login.html',
                        controller: 'LoginCtrl',
                        data: {
                            requireLogin: false
                        }
                    })

                    .state('app.logout', {
                        url: '/logout',
                        views: {
                            'menuContent': {
                                controller: 'LogoutCtrl'
                            }
                        },
                        data: {
                            requireLogin: true
                        }
                    })


                    .state('app.noticias', {
                        url: '/noticias',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/noticias.html',
                                controller: 'NoticiasCtrl'
                            }
                        }
                    })

                    .state('app.noticia', {
                        url: '/noticias/:noticiaId',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/noticia.html',
                                controller: 'NoticiaCtrl'
                            }
                        }
                    })

                    .state('app.clientes', {
                        url: '/clientes',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/clientes.html',
                                controller: 'ClientesCtrl'
                            }
                        }
                    })

                    .state('app.cliente', {
                        url: '/clientes/:clienteId',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/matriculas.html',
                                controller: 'MatriculasCtrl'
                            }
                        }
                    })

                    .state('app.matriculas', {
                        url: '/matriculas',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/matriculas.html',
                                controller: 'MatriculasCtrl'
                            }
                        },
                        params : {
                          clienteId : 0
                        }
                    })



                    .state('app.videotutoriales', {
                        url: '/videotutoriales',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/videotutoriales.html',
                                controller: 'VideosCtrl'
                            }
                        }
                    })

                    ;
            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/login');
        });
